# LaTeX Chatbot CLI

A command-line interface for interacting with LaTeX chatbot services.

## CLI Commands

### Initialize a new LaTeX project

```bash
make dev init
make dev init --template minimal
```

### Compile the LaTeX project

```bash
make dev compile
```

### Chat with the LaTeX chatbot

```bash
make dev chat "Hello"
```

### Show configuration

```bash
make dev config
make dev config <key>
```

### Nuke the config

```bash
make dev nuke
```

### Show version

```bash
make dev version
```

## CLSI (Common LaTeX Service Interface)

### Build the CLSI Docker image

```bash
make clsi-build
```

### Start CLSI services

```bash
make clsi-up
```

### Stop CLSI services

```bash
make clsi-down
```
