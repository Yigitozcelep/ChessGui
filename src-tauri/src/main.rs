// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{State, AppHandle, Builder};
use std::sync::Mutex;

pub mod engine_communucation;
use crate::engine_communucation::EngineCommunications;

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
    let mut engine = engine_state.0.lock().expect("Failed to lock engine state");
    engine.add_unpiped_engine(path, id);
}

#[tauri::command]
fn find_best_move(engine_state: State<'_, EngineCommunicationsState>, id: usize, position: String) {
    let mut engine = engine_state.0.lock().expect("Failed to lock engine state");
    engine.find_best_move(position, id);
}

#[tauri::command] 
fn initialize_communication(engine_state: State<'_, EngineCommunicationsState>, app: AppHandle) {
    let mut engine = engine_state.0.lock().expect("Failed to lock engine state");
    engine.initialize(app);
}

#[tauri::command]
fn pipe_engine(engine_state: State<'_, EngineCommunicationsState>, id: usize) {
    let mut engine = engine_state.0.lock().expect("Failed to lock engine state");
    engine.piped_engine(id);
}

#[tauri::command]
fn uci_test(engine_state: State<'_, EngineCommunicationsState>, id: usize) {
    let mut engine = engine_state.0.lock().expect("Failed to lock engine state");
    engine.uci_test(id);
}

#[tauri::command]
fn drop_pipe(engine_state: State<'_, EngineCommunicationsState>, id: usize) {
    let mut engine = engine_state.0.lock().expect("Failed to lock engine state");
    engine.drop_pipe(id);
}

#[tauri::command]
fn search_perft(engine_state: State<'_, EngineCommunicationsState>, id: usize, position: String, depth: usize) {
    let mut engine = engine_state.0.lock().expect("Failed to lock engine state");
    engine.search_perft(position, depth, id);
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
