# LaTeX Chatbot Frontend

A modern, responsive desktop application for LaTeX editing, built with Tauri, React, and TypeScript.

## Features

- **Split View Editor**: Real-time preview of LaTeX code side-by-side with the compiled PDF.
- **AI Integration**: Chat interface for requesting edits, explanations, and code generation.
- **Project Structure**: Visual file explorer for managing LaTeX projects.
- **Settings**: Configure LLM providers and editor preferences.

## Architecture

This frontend is a React application served by Tauri. It communicates with the backend `editor-cli` sidecar process for heavy lifting (compilation, AI inference).

- **Tauri**: Provides the native window, menu system, and sidecar management.
- **React**: UI components and state management.
- **Sonner**: Toast notifications for user feedback.

## Development

Prerequisites: Node.js 20+, Rust (stable).

### Running Locally

```bash
# From project root
make gui
```

Or manually:

```bash
cd editor-gui
npm install
npm run tauri dev
```

The application will launch in a native window, wrapping the React dev server running on `http://localhost:1420`.
