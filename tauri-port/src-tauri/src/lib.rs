use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::{Manager, State};

struct NodeServer(Mutex<Option<Child>>);

#[tauri::command]
fn get_server_port() -> u16 {
    3456
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(NodeServer(Mutex::new(None)))
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Find the mcp-manager-server.js — it lives in the src directory (dev)
            // or in the resource directory (production)
            let server_script = {
                // In dev mode: relative to the app's resource directory
                let resource_path = app_handle
                    .path()
                    .resource_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("."));

                let dev_path = std::path::PathBuf::from("src/mcp-manager-server.js");
                let prod_path = resource_path.join("mcp-manager-server.js");

                if dev_path.exists() {
                    dev_path
                } else {
                    prod_path
                }
            };

            // Spawn Node.js server
            let child = Command::new("node")
                .arg(&server_script)
                .spawn();

            match child {
                Ok(c) => {
                    println!("[Tauri] Node server started (PID: {})", c.id());
                    let state: State<NodeServer> = app_handle.state();
                    *state.0.lock().unwrap() = Some(c);
                }
                Err(e) => {
                    eprintln!("[Tauri] Failed to start Node server: {}", e);
                }
            }

            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Node process will be cleaned up by OS when app exits
            }
        })
        .invoke_handler(tauri::generate_handler![get_server_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
