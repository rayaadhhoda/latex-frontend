# Catch-all target to prevent Make from erroring on extra arguments
%:
	@:

init:
	@cd sidecar && uv sync
	@cd frontend && npm install
	@uv run build.py --link-only
	@echo "Initialized project! Run 'make dev' to start the development server."

server:
	@cd sidecar && uv run latex-chatbot-sidecar

gui:
	@cd frontend && npm run tauri dev

dev:
	@echo "Starting development server..."
	@uv run build.py --link-only
	@echo "Starting Tauri app..."
	@cd frontend && npm run tauri dev

build:
	@uv run build.py

do-benchmark:
	@cd benchmark && uv run benchmark --dir temp run $(filter-out $@,$(MAKECMDGOALS))

dashboard:
	@cd benchmark && uv run dashboard --dir temp
