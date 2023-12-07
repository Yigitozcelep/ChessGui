// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{State, AppHandle, Builder};
use std::sync::Mutex;

pub mod engine_communucation;
use crate::engine_communucation::EngineCommunications;

pub struct EngineCommunicationsState(Mutex<EngineCommunications>);

#[tauri::command]
fn add_unpiped_engine(engine_state: State<'_, EngineCommunicationsState>, path: String) {
    let mut engine = engine_state.0.lock().expect("Failed to lock engine state");
    engine.add_unpiped_engine(path);
    println!("{:?}", engine);
}

#[tauri::command]
fn find_best_move(engine_state: State<'_, EngineCommunicationsState>, id: usize) {
    let mut engine = engine_state.0.lock().expect("Failed to lock engine state");
    engine.find_best_move(id);
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
fn drop_pipe(engine_state: State<'_, EngineCommunicationsState>, id: usize) {
    let mut engine = engine_state.0.lock().expect("Failed to lock engine state");
    engine.drop_pipe(id);
}

fn main() {
    // Initialize your Tauri application with the state
    Builder::default()
        .manage(EngineCommunicationsState(Mutex::new(EngineCommunications::new())))
        .invoke_handler(tauri::generate_handler![
            initialize_communication,
            find_best_move,
            add_unpiped_engine,
            drop_pipe,
            pipe_engine
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
