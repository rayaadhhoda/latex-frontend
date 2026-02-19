# LaTeX Chatbot Editor

A powerful, AI-assisted LaTeX editor featuring a local FastAPI backend, a Tauri + React frontend, and a built-in benchmark suite.

## Architecture

The project consists of three main components:

- **`editor-cli`**: A Python-based FastAPI server that handles LaTeX compilation, project management, and AI chat interactions. It uses `langgraph` for agentic workflows.
- **`editor-gui`**: A desktop application built with Tauri, React, and TypeScript. It bundles the CLI as a sidecar executable.
- **`benchmark`**: A dedicated CLI tool for evaluating the performance and accuracy of the chatbot agents.

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
    Starts both the backend server and the frontend GUI in development mode.
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

## Usage

| Command | Description |
|---------|-------------|
| `make init` | Install Python and Node.js dependencies. |
| `make dev` | Run the full stack in development mode. |
| `make server` | Run only the FastAPI server. |
| `make gui` | Run only the Tauri frontend. |
| `make build` | Build the production application. |
| `make do-benchmark` | Run the benchmark suite. |

## License

See [LICENSE](LICENSE) file for details.
