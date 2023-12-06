// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
pub mod engine_communucation;
use crate::engine_communucation::EngineCommunications;

use tauri::{AppHandle, State};
pub struct EngineCommunicationsState(std::sync::Mutex<EngineCommunications>);

static mut ENGINE_COMMUNUCATION: EngineCommunications = EngineCommunications::new();


#[tauri::command]
fn add_new_engine(path: String)            { unsafe { ENGINE_COMMUNUCATION.add_new_engine(path); } }

#[tauri::command]
fn get_best_move()                         { unsafe { ENGINE_COMMUNUCATION.find_best_move(); } }

#[tauri::command] 
fn initialize_cominication(app: AppHandle) { unsafe { ENGINE_COMMUNUCATION.initialize(app); } }

#[tauri::command]
fn drop_engine()                           { unsafe { ENGINE_COMMUNUCATION.drop_engine(); } }


fn main() {
    // Create channels for sending and receiving messages
    tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![initialize_cominication, get_best_move, add_new_engine, drop_engine])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}