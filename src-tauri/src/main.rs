// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use persa_chess;


#[tauri::command]
fn get_moves(fen: String) -> Vec<String>{
    persa_chess::get_moves(fen)
}

#[tauri::command]
fn make_move(fen: String, mov: String) -> String {
    persa_chess::make_move(fen, mov)
}

#[tauri::command]
fn is_king_attacked(fen: String) -> bool {
    persa_chess::is_king_attacked(fen)
}

#[tauri::command]
fn get_king_coor(fen: String) -> String {
    persa_chess::get_king_coor(fen)
}

#[tauri::command]
fn get_engine_move(fen: String) -> String {
    persa_chess::get_best_move(fen, 4)
}

fn main() {
    persa_chess::init_all_statics();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_moves, make_move, is_king_attacked, get_king_coor, get_engine_move])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
