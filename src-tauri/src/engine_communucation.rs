use std::fmt::format;
use std::io::{BufReader, BufRead, Write};
use std::process::{Command, Stdio, ChildStdin, ChildStdout};
use std::sync::{Arc, Mutex};
use std::sync::mpsc::{Sender, channel, Receiver};
use std::thread;
use tauri::{command, AppHandle, Manager, App, Window};


pub fn get_expected_output(input: &str) -> String {
    if input.contains("go perft") {return "Nodes searched: ".to_string();}
    if input.contains("go") {return "bestmove".to_string()}

    unreachable!();
}

pub fn comminucate(path: String, sender: Sender<String>) -> ChildStdin {
    let mut child = Command::new(path)
                    .stdin(Stdio::piped())
                    .stdout(Stdio::piped())
                    .spawn()
                    .unwrap();
    
    let stdin = child.stdin.take().unwrap();
    let stdout = child.stdout.take().unwrap();
    
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            sender.send(line.unwrap()).unwrap();
        }
    });
    return stdin;
}


enum EngineTask {
    Waiting,
    SearchingMove,
    SearchingPerft,
}

pub struct Engine {
    stdin: ChildStdin,
    current_task: EngineTask,
}

impl Engine{
    pub fn new(path: String, app: Arc<AppHandle>) -> Self {
        let mut child = Command::new(path)
                                .stdin(Stdio::piped())
                                .stdout(Stdio::piped())
                                .spawn()
                                .unwrap();
        
        
        thread::spawn(move || {
            println!("thread started");
            let reader = BufReader::new(child.stdout.unwrap());
            for line in reader.lines() {
                app.emit_all("muz", line.unwrap());
            }
            println!("thread is dead");
        });

        Self {
            stdin: child.stdin.take().unwrap(),
            current_task: EngineTask::Waiting,
        }
    }
}


pub struct EngineCommunications{
    pipes   : Vec<Engine>,
    app: Option<Arc<AppHandle>>,
}

impl EngineCommunications {
    pub const fn new() -> Self {
        Self { pipes:  Vec::new(), app: None}
    }

    pub fn initialize(&mut self, app: AppHandle) {
        self.app = Some(Arc::new(app));
    }
    
    pub fn add_new_engine(&mut self, path: String) {
        let app = self.app.as_ref().unwrap().clone();
        self.pipes.push(Engine::new(path, app));
    }
    
    pub fn find_best_move(&mut self) {
        self.pipes[0].stdin.write_all("uci\n".to_string().as_bytes()).unwrap();
        
    }
    
    pub fn drop_engine() {

    }
}