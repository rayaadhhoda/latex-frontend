# Catch-all target to prevent Make from erroring on extra arguments
%:
	@:

init:
	@cd sidecar && uv sync
	@cd frontend && npm install
	@uv run build.py
	@echo "Initialized project! Run 'make dev' to start the development server."

sidecar:
	@cd sidecar && uv run spartan-write-sidecar

server:
	@cd server && uv run spartan-write-server

docs:
	@cd user-guide && uv run mkdocs serve

build-docs:
	@cd user-guide && uv run mkdocs build

build:
	@uv run build.py

dev:
	@uv run build.py --debug
	@cd frontend && open "./src-tauri/target/debug/bundle/macos/Spartan Write.app"

run:
	@cd frontend && open "./src-tauri/target/debug/bundle/macos/Spartan Write.app"

do-benchmark:
	@cd benchmark && uv run benchmark --dir temp run $(filter-out $@,$(MAKECMDGOALS))

dashboard:
	@cd benchmark && uv run dashboard --dir temp
