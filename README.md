# Spartan Write

A powerful, AI-assisted LaTeX editor featuring a local FastAPI backend, a Tauri + React frontend, and a built-in benchmark suite.

## Architecture

The project consists of three main components:

- **`server`**: A Python-based FastAPI server running in the cloud. See [Sidecar Documentation](wiki/Sidecar.md).
- **`sidecar`**: A Python-based FastAPI server running alongside the frontend. See [Sidecar Documentation](wiki/Sidecar.md).
- **`frontend`**: A Tauri + React frontend. See [Frontend Documentation](wiki/Frontend.md).
- **`benchmark`**: A CLI tool for evaluation. See [Benchmark Documentation](wiki/Benchmark.md).

## Prerequisites

- **Python**: 3.10+ (managed via `uv`)
- **Node.js**: 20+ (for frontend)
- **Rust**: Latest stable (for Tauri)
- **Tectonic**: Typesetting engine (downloaded automatically during build)

## Quick Start

1.  **Initialize Dependencies**:
    ```bash
    make init
    ```

2.  **Run Development Environment**:
    Starts the server, sidecar, and the frontend in development mode.
    You must run `make build` once to set up deeplinks for authentication, before trying to start the dev server.
    ```bash
    make dev
    ```

## Build Process

The application is built using a custom `build.py` script that:
1.  Builds the Python CLI wheel using `uv`.
2.  Creates a standalone executable using `PyInstaller`.
3.  Bundles the executable as a Tauri sidecar.
4.  Builds the final Tauri application.

To build the project:
```bash
make build
```

## License

See [LICENSE](LICENSE) file for details.
