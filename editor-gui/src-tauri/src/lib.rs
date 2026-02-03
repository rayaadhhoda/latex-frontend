use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;

// Global state to hold the server process
struct ServerState(Mutex<Option<CommandChild>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(ServerState(Mutex::new(None)))
        .setup(|app| {
            // Launch the sidecar server on startup
            let sidecar = app.shell().sidecar("latex-chatbot-cli")
                .expect("Failed to create sidecar command");
            
            let (mut rx, child) = sidecar.spawn().expect("Failed to spawn sidecar");

            // Log sidecar output for debugging
            tauri::async_runtime::spawn(async move {
                use tauri_plugin_shell::process::CommandEvent;
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            println!("[sidecar stdout] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Stderr(line) => {
                            eprintln!("[sidecar stderr] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Terminated(payload) => {
                            println!("[sidecar] terminated with code: {:?}", payload.code);
                        }
                        _ => {}
                    }
                }
            });

            // Store the child process handle
            let state = app.state::<ServerState>();
            *state.0.lock().unwrap() = Some(child);

            println!("Server started on http://127.0.0.1:8765");
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                // Kill the server when the app exits (handles Ctrl+C and all exit paths)
                let state = app_handle.state::<ServerState>();
                let mut guard = state.0.lock().unwrap();
                if let Some(child) = guard.take() {
                    let _ = child.kill();
                    println!("Server stopped");
                }
            }
        });
}
