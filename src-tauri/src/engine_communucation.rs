use std::io::{BufReader, BufRead, Write};
use std::process::{Command, Stdio, ChildStdin};
use std::thread;
use tauri::{AppHandle, Manager};

trait OutputFormeter {
    fn read_new_line(&mut self, line: String);
    fn is_data_collection_complete(&self) -> bool;
    fn send_information(&self);
}

struct SearchMove(Vec<String>);
impl SearchMove {
    pub fn new () -> Self { Self(Vec::new()) }
}


impl OutputFormeter for SearchMove {
    fn read_new_line(&mut self, line: String) {
        let mut data = line.split_whitespace();
        if data.next().unwrap() == "bestmove" { self.0.push(data.next().unwrap().to_string())}
    }
    fn is_data_collection_complete(&self) -> bool {
        true
    }
    fn send_information(&self) {
        
    }
}


pub struct UnpipedEngine(String);
impl UnpipedEngine {
    pub fn new(path: String) -> Self { Self(path) }
    pub fn piped(&self) -> PipedEngine { PipedEngine::new(self.0, Box::new(SearchMove::new())) }
}

pub struct PipedEngine {
    stdin: ChildStdin,
    output_formeter: Box<dyn OutputFormeter>,
    is_searching: bool,
}

impl PipedEngine{

    pub fn new(path: String, output_formeter: Box<dyn OutputFormeter>) -> Self {
        let mut child = Command::new(path)
                                .stdin(Stdio::piped())
                                .stdout(Stdio::piped())
                                .spawn()
                                .unwrap();
        
        Self {
            stdin: child.stdin.take().unwrap(),
            is_searching: false,
            output_formeter: Box::new(SearchMove::new()),
        }
    }
}


pub struct EngineCommunications{
    piped_engines   : Vec<PipedEngine>,
    unpiped_engines : Vec<UnpipedEngine>,
    app: Option<AppHandle>,
}

impl EngineCommunications {
    pub const fn new() -> Self {
        Self { piped_engines:  Vec::new(), unpiped_engines: Vec::new(), app: None}
    }

    pub fn initialize(&mut self, app: AppHandle) {
        self.app = Some(app);
    }
    
    pub fn add_unpiped_engine(&mut self, path: String) {
        let app = self.app.as_ref().unwrap().clone();
        self.unpiped_engines.push(UnpipedEngine::new(path));
    }
    
    pub fn find_best_move(&mut self) {
        //self.pipes[0].stdin.write_all("position startpos\ngo depth 5\n".to_string().as_bytes()).unwrap();
    }
    
    pub fn drop_engine(&mut self) {
        //self.pipes[0].stdin.write_all("quit\n".to_string().as_bytes()).unwrap();
    }
}