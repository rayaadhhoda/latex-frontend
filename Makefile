# Catch-all target to prevent Make from erroring on extra arguments
%:
	@:

init:
	@cd editor-cli && uv sync
	@cd editor-gui && npm install
	@uv run build.py --link-only
	@echo "Initialized project! Run 'make dev' to start the development server."

gui:
	@cd editor-gui && npm run dev

dev:
	@echo "Starting development server..."
	@uv run build.py --link-only
	@echo "Starting Tauri app..."
	@cd editor-gui && npm run tauri dev

dev-gui:
	@cd editor-gui && npm run tauri dev

build:
	@uv run build.py

clsi-build:
	@echo "Building CLSI Docker image..."
	@./editor-cli/clsi/build-clsi.sh

clsi-up:
	@docker compose -f editor-cli/clsi/docker-compose.yml down
	@docker compose -f editor-cli/clsi/docker-compose.yml up -d

clsi-down:
	docker compose -f editor-cli/clsi/docker-compose.yml down
