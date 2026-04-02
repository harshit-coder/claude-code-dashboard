use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use tauri::{Manager, State};

struct NodeServer(Mutex<Option<std::process::Child>>);

fn find_server_script(app: &tauri::AppHandle) -> Option<PathBuf> {
    // Production: bundled in resources/app/mcp-manager-server.js
    if let Ok(res_dir) = app.path().resource_dir() {
        let prod = res_dir.join("app").join("mcp-manager-server.js");
        if prod.exists() {
            println!("[Tauri] Found server at: {}", prod.display());
            return Some(prod);
        }
        // Fallback: flat resources dir (in case of older build)
        let flat = res_dir.join("mcp-manager-server.js");
        if flat.exists() {
            println!("[Tauri] Found server (flat) at: {}", flat.display());
            return Some(flat);
        }
    }

    // Dev mode: look relative to the workspace root
    let dev_paths = [
        PathBuf::from("../mcp-manager-server.js"),         // from tauri-port/src-tauri/
        PathBuf::from("../../mcp-manager-server.js"),
        PathBuf::from("src/mcp-manager-server.js"),
    ];
    for p in &dev_paths {
        if p.exists() {
            println!("[Tauri] Dev mode server at: {}", p.display());
            return Some(p.clone());
        }
    }

    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(NodeServer(Mutex::new(None)))
        .setup(|app| {
            let app_handle = app.handle().clone();

            match find_server_script(&app_handle) {
                Some(script_path) => {
                    // Set cwd to the script's directory so __dirname works correctly
                    let script_dir = script_path
                        .parent()
                        .map(|p| p.to_path_buf())
                        .unwrap_or_else(|| PathBuf::from("."));

                    println!("[Tauri] Starting Node server...");
                    println!("[Tauri]   script : {}", script_path.display());
                    println!("[Tauri]   cwd    : {}", script_dir.display());

                    match Command::new("node")
                        .arg(&script_path)
                        .current_dir(&script_dir)   // __dirname = script_dir
                        .spawn()
                    {
                        Ok(child) => {
                            println!("[Tauri] Node server started (PID: {})", child.id());
                            let state: State<NodeServer> = app_handle.state();
                            *state.0.lock().unwrap() = Some(child);
                        }
                        Err(e) => {
                            eprintln!("[Tauri] ERROR: Failed to start Node.js: {}", e);
                            eprintln!("[Tauri] Make sure Node.js is installed and in PATH.");
                        }
                    }
                }
                None => {
                    eprintln!("[Tauri] ERROR: mcp-manager-server.js not found in any expected location.");
                }
            }

            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // OS cleans up child process when parent exits
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
