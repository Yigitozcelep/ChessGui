// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use persa_chess;

#[tauri::command]
fn get_moves() -> Vec<String>{
    let res = persa_chess::get_moves("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1".to_string());
    println!("{:?}", res);
    res
}

#[tauri::command]
fn make_move(fen: String, mov: String) -> String {
    persa_chess::make_move(fen, mov)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_moves, make_move])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
