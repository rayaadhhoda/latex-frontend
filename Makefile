# Catch-all target to prevent Make from erroring on extra arguments
%:
	@:

dev:
	uv run latex-chatbot --dir=temp $(filter-out $@,$(MAKECMDGOALS))

build:
	uv build

clsi-build:
	@echo "Building CLSI Docker image..."
	@./clsi/build-clsi.sh

clsi-up:
	docker compose -f clsi/docker-compose.yml up -d

clsi-down:
	docker compose -f clsi/docker-compose.yml down
