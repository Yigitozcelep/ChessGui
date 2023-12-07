use std::fmt::Debug;
use std::io::{BufReader, BufRead, Write};
use std::process::{Command, Stdio, ChildStdin};
use std::thread;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

pub trait OutputFormeter: Send + Debug {
    fn read_new_line(&mut self, line: String);
    fn is_data_collection_complete(&self) -> bool;
    fn send_information(&self, app: &AppHandle);
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
    fn send_information(&self, app: &AppHandle) {
        app.emit_all("best_move_listener", self.0.clone()).unwrap();
    }
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
    fn send_information(&self, app: &AppHandle) {
        app.emit_all("uci_listener", self.0).unwrap();
    }
}

#[derive(Debug)]
pub struct UnpipedEngine(String);
impl UnpipedEngine {
    pub fn new(path: String) -> Self { Self(path) }
    pub fn piped(&self, app: AppHandle) -> PipedEngine { 
        let mut engine = PipedEngine::new(self.0.clone(), Arc::new(Mutex::new(Box::new(CommandUci::new()))), app);
        engine.stdin.write_all("uci\n".as_bytes()).unwrap();
        engine
    }
}

#[derive(Debug)]
pub struct PipedEngine {
    stdin: ChildStdin,
    output_formeter: Arc<Mutex<Box<dyn OutputFormeter>>>,
    path: String,
}

impl PipedEngine{
    pub fn new(path: String, output_formeter: Arc<Mutex<Box<dyn OutputFormeter>>>, app: AppHandle) -> Self {
        let mut child = Command::new(path.clone())
                                .stdin(Stdio::piped())
                                .stdout(Stdio::piped())
                                .spawn()
                                .unwrap();
        
        let thread_formeter = output_formeter.clone();
        thread::spawn(move || {
            let reader = BufReader::new(child.stdout.take().unwrap());
            for line in reader.lines() {
                let mut cur_formeter = thread_formeter.lock().unwrap();
                cur_formeter.read_new_line(line.unwrap());
                if cur_formeter.is_data_collection_complete() { 
                    cur_formeter.send_information(&app);
                }
            }
        });

        Self {
            stdin: child.stdin.take().unwrap(),
            output_formeter,
            path
        }
    }

    pub fn quit_search(&mut self) { self.stdin.write_all("quit\n".as_bytes()).unwrap(); }
    pub fn find_best_move(&mut self, position: String) {
        *self.output_formeter.lock().unwrap() = Box::new(CommandBestMove::new());
        let input = format!("position {}\ngo depth 5\n", position);
        self.stdin.write_all(input.as_bytes()).unwrap();
    }
    pub fn unpiped(&mut self) -> UnpipedEngine {
        self.stdin.write_all("quit\n".to_string().as_bytes()).unwrap();
        UnpipedEngine::new(self.path.clone())
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
    
    pub fn add_unpiped_engine(&mut self, path: String) {
        self.engines.push(EngineType::UnpipedEngine(UnpipedEngine::new(path)));
    }

    pub fn piped_engine(&mut self, id: usize) {
        if let EngineType::UnpipedEngine(engine) = &self.engines[id] {
            self.engines[id] = EngineType::PipedEngine(engine.piped(self.app.clone().unwrap()));
        }
    }
    
    pub fn find_best_move(&mut self, id: usize) {
        if let EngineType::PipedEngine(engine) = &mut self.engines[id] {
            engine.find_best_move("startpos".to_string());
        }
    }
    
    pub fn drop_pipe(&mut self, id: usize) {
        if let EngineType::PipedEngine(engine) = &mut self.engines[id] {
            self.engines[id] = EngineType::UnpipedEngine(engine.unpiped())
        }
    }
}