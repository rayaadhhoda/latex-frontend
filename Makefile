# Catch-all target to prevent Make from erroring on extra arguments
%:
	@:

cli:
	cd editor-cli && uv run latex-chatbot --dir=temp $(filter-out $@,$(MAKECMDGOALS))

dev:
	cd editor-gui && npm run tauri dev

build:
	@uv run build.py

cli-build:
	@cd editor-cli && uv run build.py

gui-build:
	@cd editor-gui && npm run tauri build

cli-build:
	@cd editor-cli && uv run build.py

clsi-build:
	@echo "Building CLSI Docker image..."
	@./editor-cli/clsi/build-clsi.sh

clsi-up:
	@docker compose -f editor-cli/clsi/docker-compose.yml down
	@docker compose -f editor-cli/clsi/docker-compose.yml up -d

clsi-down:
	docker compose -f editor-cli/clsi/docker-compose.yml down
