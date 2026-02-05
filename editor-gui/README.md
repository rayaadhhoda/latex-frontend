# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Sidecar Build

The GUI bundles the `latex-chatbot-cli` Python application as a sidecar binary. Run `make build` from the project root to:

1. Build the Python wheel via `uv build`
2. Create a platform-specific executable using PyInstaller
3. Place the binary in `src-tauri/bin/` with the appropriate target triple suffix

The sidecar is built for the current host platform only. For cross-platform releases, run the build on each target OS (macOS, Windows, Linux).
