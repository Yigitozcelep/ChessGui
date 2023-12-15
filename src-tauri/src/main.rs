// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{State, AppHandle, Builder};
use std::sync::Mutex;

pub mod engine_communucation;
use crate::engine_communucation::{EngineCommunications, SearchData};

pub struct EngineCommunicationsState(Mutex<EngineCommunications>);


#[tauri::command]
fn add_unpiped_engine(engine_state: State<'_, EngineCommunicationsState>, path: String) {
    let mut engine_comminucation = engine_state.0.lock().expect("Failed to lock engine state");
    engine_comminucation.add_unpiped_engine(path);
}

#[tauri::command]
fn find_best_move(engine_state: State<'_, EngineCommunicationsState>, id: usize, search_data: SearchData) {
    let mut engine_comminucation = engine_state.0.lock().expect("Failed to lock engine state");
    engine_comminucation.find_best_move("startpos".to_string(), id, search_data);
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

#[tauri::command]
fn delete_engine(engine_state: State<'_, EngineCommunicationsState>, id: usize) {
    let mut engine_comminucation = engine_state.0.lock().expect("Failed to lock engine state");
    engine_comminucation.delete_engine(id);
}


#[tauri::command]
fn get_moves(fen: String) -> Vec<String> {
    persa_chess::get_moves(fen)
}


#[tauri::command]
fn make_move(fen: String, move_name: String) -> String {
    persa_chess::make_move(fen, move_name)
}

#[tauri::command]
fn is_king_attacked(fen: String) -> bool {
    persa_chess::is_king_attacked(fen)
}

fn main() {
    // Initialize your Tauri application with the state
    persa_chess::init_all_statics();
    Builder::default()
        .manage(EngineCommunicationsState(Mutex::new(EngineCommunications::new())))
        .invoke_handler(tauri::generate_handler![
            initialize_communication,
            find_best_move,
            add_unpiped_engine,
            drop_pipe,
            pipe_engine,
            uci_test,
            search_perft,
            stop_operation,
            delete_engine,
            get_moves,
            make_move,
            is_king_attacked,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
