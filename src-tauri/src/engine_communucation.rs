use std::collections::HashMap;
use std::fmt::Debug;
use std::io::{BufReader, BufRead, Write};
use std::process::{Command, Stdio, ChildStdin};
use std::thread;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

pub trait OutputFormeter: Send + Debug {
    fn read_new_line(&mut self, line: String);
    fn is_data_collection_complete(&self) -> bool;
    fn send_information(&self, app: &AppHandle, id: usize);
}

#[derive(Debug)]
struct CommandPerft {
    data: HashMap<String, String>, 
    is_complete: bool,
}

impl OutputFormeter for CommandPerft {
    fn read_new_line(&mut self, line: String) {
        if line.trim() == "" {return; }
        if line.starts_with("Nodes searched") {
            self.is_complete = true;
            return;
        }
        let mut data = line.split_whitespace();
        let key = data.next().unwrap();
        let value = data.next().unwrap();
        self.data.insert(key.to_string(), value.to_string());
    }
    fn is_data_collection_complete(&self) -> bool {
        self.is_complete
    }
    fn send_information(&self, app: &AppHandle, id: usize) {
        let listener = format!("perft_listener_id{}", id);
        app.emit_all(&listener, self.data.clone()).unwrap();
    }
}

impl CommandPerft {
    pub fn new() -> Self { 
        Self { data: HashMap::new(), is_complete: false }
    }
}


#[derive(Debug)]
struct CommandBestMove(String);
impl CommandBestMove {
    pub fn new () -> Self { Self(String::new()) }
}

impl OutputFormeter for CommandBestMove {
    fn read_new_line(&mut self, line: String) {
        let mut data = line.split_whitespace();
        if data.next().unwrap() == "bestmove" { self.0 += &(data.next().unwrap().to_string() + "\n")}
    }
    fn is_data_collection_complete(&self) -> bool {
        self.0.len() > 0
    }
    fn send_information(&self, app: &AppHandle, id: usize) {
        let listener = format!("best_move_listener_id{}", id);
        app.emit_all(&listener, self.0.clone()).unwrap();
    }
}

#[derive(Debug)]
struct CommandNothing;
impl OutputFormeter for CommandNothing {
    fn is_data_collection_complete(&self) -> bool {  false }
    fn read_new_line(&mut self, _line: String) { }
    fn send_information(&self, _app: &AppHandle, _id: usize) { }
}

#[derive(Debug)]
struct CommandUci(bool);
impl CommandUci {
    pub fn new() -> Self {Self(false)}
}

impl OutputFormeter for CommandUci {
    fn read_new_line(&mut self, line: String) {
        if line == "uciok" {self.0 = true}
    }
    fn is_data_collection_complete(&self) -> bool {
        self.0
    }
    fn send_information(&self, app: &AppHandle, id: usize) {
        let listener = format!("uci_listener_id{}", id);
        println!("{}", listener);
        app.emit_all(&listener, self.0).unwrap();
    }
}

#[derive(Debug)]
pub struct UnpipedEngine {
    path: String,
    id: usize,
}
impl UnpipedEngine {
    pub fn new(path: String, id: usize) -> Self { 
        Self { path, id}
    }

    pub fn piped(&self, app: AppHandle) -> PipedEngine { 
        PipedEngine::new(self.path.clone(), Arc::new(Mutex::new(Box::new(CommandNothing))), app, self.id)
    }
}

#[derive(Debug)]
pub struct PipedEngine {
    stdin: ChildStdin,
    output_formeter: Arc<Mutex<Box<dyn OutputFormeter>>>,
    path: String,
    id: usize,
}

impl PipedEngine{
    pub fn new(path: String, output_formeter: Arc<Mutex<Box<dyn OutputFormeter>>>, app: AppHandle, id: usize) -> Self {
        let mut child = Command::new(path.clone())
                                .stdin(Stdio::piped())
                                .stdout(Stdio::piped())
                                .spawn()
                                .unwrap();
        
        let thread_formeter = output_formeter.clone();
        
        let engine_id = id.clone();
        thread::spawn(move || {
            println!("thread started {}", engine_id);
            let reader = BufReader::new(child.stdout.take().unwrap());
            for line in reader.lines() {
                let mut cur_formeter = thread_formeter.lock().unwrap();
                cur_formeter.read_new_line(line.unwrap());
                if cur_formeter.is_data_collection_complete() { 
                    cur_formeter.send_information(&app, engine_id);
                }
            }
            println!("thread end {}", engine_id);
        });

        Self {
            stdin: child.stdin.take().unwrap(),
            output_formeter,
            path,
            id,
        }
    }

    pub fn quit_search(&mut self) { self.stdin.write_all("quit\n".as_bytes()).unwrap(); }
    pub fn find_best_move(&mut self, position: String) {
        *self.output_formeter.lock().unwrap() = Box::new(CommandBestMove::new());
        let input = format!("position {}\ngo depth 5\n", position);
        self.stdin.write_all(input.as_bytes()).unwrap();
    }
    pub fn uci_test(&mut self) {
        *self.output_formeter.lock().unwrap() = Box::new(CommandUci::new());
        self.stdin.write_all("uci\n".as_bytes()).unwrap();
    }

    pub fn search_perft(&mut self, position: String, depth: usize) {
        *self.output_formeter.lock().unwrap() = Box::new(CommandPerft::new());
        let input = format!("position {}\ngo perft {}\n", position, depth);
        self.stdin.write_all(input.as_bytes()).unwrap();
    }

    pub fn unpiped(&mut self) -> UnpipedEngine {
        self.stdin.write_all("quit\n".to_string().as_bytes()).unwrap();
        UnpipedEngine::new(self.path.clone(), self.id)
    }
}

#[derive(Debug)]
enum EngineType {
    PipedEngine(PipedEngine),
    UnpipedEngine(UnpipedEngine),
}

pub struct EngineCommunications{
    engines         : Vec<EngineType>,
    app             : Option<AppHandle>,
}

impl Debug for EngineCommunications {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("EngineCommunications")
                .field("engines", &self.engines)
                .field("app", &self.app.is_some())
                .finish()
    }
}

impl EngineCommunications {
    pub const fn new() -> Self {
        Self { engines: Vec::new(), app: None}
    }

    pub fn initialize(&mut self, app: AppHandle) {
        self.app = Some(app);
    }
    
    pub fn add_unpiped_engine(&mut self, path: String, id: usize) {
        self.engines.push(EngineType::UnpipedEngine(UnpipedEngine::new(path, id)));
    }

    pub fn piped_engine(&mut self, id: usize) {
        if let EngineType::UnpipedEngine(engine) = &self.engines[id] {
            self.engines[id] = EngineType::PipedEngine(engine.piped(self.app.clone().unwrap()));
        }
    }

    pub fn uci_test(&mut self, id: usize) {
        if let EngineType::PipedEngine(engine) = &mut self.engines[id] {
            engine.uci_test();
        }
    }
    
    pub fn find_best_move(&mut self, position: String, id: usize) {
        if let EngineType::PipedEngine(engine) = &mut self.engines[id] {
            engine.find_best_move(position);
        }
    }
    
    pub fn drop_pipe(&mut self, id: usize) {
        if let EngineType::PipedEngine(engine) = &mut self.engines[id] {
            self.engines[id] = EngineType::UnpipedEngine(engine.unpiped());
        }
    }
    pub fn search_perft(&mut self, position: String, depth: usize, id: usize) {
        if let EngineType::PipedEngine(engine) = &mut self.engines[id] {
            engine.search_perft(position, depth);
        }
    }
}