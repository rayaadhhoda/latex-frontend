# Catch-all target to prevent Make from erroring on extra arguments
%:
	@:

init:
	@cd sidecar && uv sync
	@cd frontend && npm install
	@uv run build.py --debug
	@echo "Initialized project! Run 'make dev' to start the development server."

server:
	@cd sidecar && uv run latex-chatbot-sidecar

dev:
	@uv run build.py --debug
	@cd frontend && open "./src-tauri/target/debug/bundle/macos/Spartan Write.app"

build:
	@uv run build.py

do-benchmark:
	@cd benchmark && uv run benchmark --dir temp run $(filter-out $@,$(MAKECMDGOALS))

dashboard:
	@cd benchmark && uv run dashboard --dir temp
