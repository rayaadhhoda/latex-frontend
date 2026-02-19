# LaTeX Chatbot Server

A FastAPI-based backend for the LaTeX Chatbot Editor. This server handles LaTeX project management, compilation (via Tectonic), and AI-powered chat interactions.

## Features

- **Project Management**: Initialize, read, and update LaTeX projects.
- **Compilation**: Compile LaTeX files to PDF using Tectonic.
- **AI Chat**: Context-aware chat using LangGraph agents.
- **Configuration**: Manage user settings and LLM credentials.

## API Reference

### Project Ops

- `POST /init`: Initialize a new project in a directory.
- `GET /files`: List files in a project directory.
- `GET /files/content`: internal endpoints for reading files.
- `PUT /files/content`: internal endpoints for updating files.

### Compilation

- `POST /compile`: Trigger a compilation for a project.
- `GET /pdf`: Retrieve the compiled PDF.

### Chat & AI

- `POST /chat`: Send a message to the AI agent.
- `POST /copilotkit`: Stream events for CopilotKit integration.

### Configuration

- `GET /config`: Retrieve current configuration.
- `POST /config`: Update configuration (e.g., OpenAI keys).
- `POST /nuke`: Reset configuration to defaults.

## Development

The server is built with Python 3.10+ and managed by `uv`.

### Running Locally

```bash
# From project root
make server
```

Or manually:

```bash
cd editor-cli
uv run latex-chatbot-server
```

The server runs on `http://127.0.0.1:8765` by default.
