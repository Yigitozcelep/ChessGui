// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{State, AppHandle, Builder};
use std::sync::Mutex;

pub mod engine_communucation;
use crate::engine_communucation::{EngineCommunications, TimeHandler};

pub struct EngineCommunicationsState(Mutex<EngineCommunications>);


#[tauri::command]
fn get_engine_names() -> Vec<String> {
    let mut file_names = Vec::new();
    for entry in std::fs::read_dir("./src/engines").unwrap() {
        let file_name = entry.unwrap().file_name();
        file_names.push(file_name.to_str().map(|s| s.to_string()).unwrap());
    }
    file_names
}

#[tauri::command]
fn add_unpiped_engine(engine_state: State<'_, EngineCommunicationsState>, path: String, id: usize) {
    let mut engine_comminucation = engine_state.0.lock().expect("Failed to lock engine state");
    engine_comminucation.add_unpiped_engine(path, id);
}

#[tauri::command]
fn find_best_move(engine_state: State<'_, EngineCommunicationsState>, id: usize, time_handler: TimeHandler) {
    let mut engine_comminucation = engine_state.0.lock().expect("Failed to lock engine state");
    engine_comminucation.find_best_move("startpos".to_string(), id, time_handler);
}

#[tauri::command] 
fn initialize_communication(engine_state: State<'_, EngineCommunicationsState>, app: AppHandle) {
    let mut engine_comminucation = engine_state.0.lock().expect("Failed to lock engine state");
    engine_comminucation.initialize(app);
}

#[tauri::command]
fn pipe_engine(engine_state: State<'_, EngineCommunicationsState>, id: usize) {
    let mut engine_comminucation = engine_state.0.lock().expect("Failed to lock engine state");
    engine_comminucation.piped_engine(id);
}

#[tauri::command]
fn uci_test(engine_state: State<'_, EngineCommunicationsState>, id: usize) {
    let mut engine_comminucation = engine_state.0.lock().expect("Failed to lock engine state");
    engine_comminucation.uci_test(id);
}

#[tauri::command]
fn drop_pipe(engine_state: State<'_, EngineCommunicationsState>, id: usize) {
    let mut engine_comminucation = engine_state.0.lock().expect("Failed to lock engine state");
    engine_comminucation.drop_pipe(id);
}

#[tauri::command]
fn search_perft(engine_state: State<'_, EngineCommunicationsState>, id: usize, position: String, depth: usize) {
    let mut engine_comminucation = engine_state.0.lock().expect("Failed to lock engine state");
    engine_comminucation.search_perft(position, depth, id);
}

#[tauri::command]
fn stop_operation(engine_state: State<'_, EngineCommunicationsState>, id: usize) {
    let mut engine_comminucation = engine_state.0.lock().expect("Failed to lock engine state");
    engine_comminucation.stop_operation(id);
}

fn main() {
    // Initialize your Tauri application with the state
    Builder::default()
        .manage(EngineCommunicationsState(Mutex::new(EngineCommunications::new())))
        .invoke_handler(tauri::generate_handler![
            get_engine_names,
            initialize_communication,
            find_best_move,
            add_unpiped_engine,
            drop_pipe,
            pipe_engine,
            uci_test,
            search_perft,
            stop_operation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
