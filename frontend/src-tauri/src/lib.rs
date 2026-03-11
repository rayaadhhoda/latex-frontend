use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_log::{Target, TargetKind};

// Global state to hold the server process
struct ServerState(Mutex<Option<CommandChild>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, _argv, _cwd| {}));
    }

    builder
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(ServerState(Mutex::new(None)))
        .setup(|app| {
            // Launch the sidecar server on startup
            let sidecar = app
                .shell()
                .sidecar("spartan-write-sidecar")
                .expect("Failed to create sidecar command");

            let (mut rx, child) = sidecar.spawn().expect("Failed to spawn sidecar");

            // Log sidecar output for debugging
            tauri::async_runtime::spawn(async move {
                use chrono::Local;
                use tauri_plugin_shell::process::CommandEvent;
                while let Some(event) = rx.recv().await {
                    let ts = Local::now().format("%H:%M:%S");
                    match event {
                        CommandEvent::Stdout(line) => {
                            log::info!("[{} sidecar stdout] {}", ts, String::from_utf8_lossy(&line).trim_end());
                        }
                        CommandEvent::Stderr(line) => {
                            log::error!("[{} sidecar stderr] {}", ts, String::from_utf8_lossy(&line).trim_end());
                        }
                        CommandEvent::Terminated(payload) => {
                            log::warn!("[{} sidecar] terminated with code: {:?}", ts, payload.code);
                        }
                        _ => {}
                    }
                }
            });

            // Store the child process handle
            let state = app.state::<ServerState>();
            *state.0.lock().unwrap() = Some(child);

            log::info!("Server started on http://127.0.0.1:8768");
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
                    log::info!("Server stopped");
                }
            }
        });
}
