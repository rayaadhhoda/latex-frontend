# Catch-all target to prevent Make from erroring on extra arguments
%:
	@:

init:
	@cd editor-cli && uv sync
	@cd editor-gui && npm install
	@uv run build.py --link-only
	@echo "Initialized project! Run 'make dev' to start the development server."

server:
	@cd editor-cli && uv run latex-chatbot-server

gui:
	@cd editor-gui && npm run tauri dev

dev:
	@echo "Starting development server..."
	@uv run build.py --link-only
	@echo "Starting Tauri app..."
	@cd editor-gui && npm run tauri dev

build:
	@uv run build.py

do-benchmark:
	@cd benchmark && uv run benchmark --dir temp run
