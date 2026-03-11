# Catch-all target to prevent Make from erroring on extra arguments
%:
	@:

init:
	@cd sidecar && uv sync
	@cd frontend && npm install
	@uv run build.py --debug
	@echo "Initialized project! Run 'make dev' to start the development server."

server:
	@cd sidecar && uv run spartan-write-sidecar

dev:
	@uv run build.py --link-only
	@cd frontend && npm run tauri dev

build:
	@uv run build.py

build-debug:
	@uv run build.py --debug
	@cd frontend && open "./src-tauri/target/debug/bundle/macos/Spartan Write.app"

do-benchmark:
	@cd benchmark && uv run benchmark --dir temp run $(filter-out $@,$(MAKECMDGOALS))

dashboard:
	@cd benchmark && uv run dashboard --dir temp
