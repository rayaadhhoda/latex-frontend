# LaTeX Chatbot CLI

A command-line interface for interacting with LaTeX chatbot services.

## Installation

### Using UV (Recommended)

Install the package in development mode:

```bash
cd cli
uv sync
uv pip install -e .
```

Or from the project root:

```bash
uv sync --directory cli
uv pip install -e cli
```

## Running the CLI

### Method 1: Using UV run (Development)

Run directly with UV:

```bash
# From the cli directory
uv run python main.py chat "Hello"
uv run python main.py convert file.tex

# Or using the module
uv run python -m cli.main chat "Hello"
```

### Method 2: Using the installed command (After installation)

Once installed, use the entry point:

```bash
latex-chatbot chat "What is the derivative of x^2?"
latex-chatbot chat --file document.tex
latex-chatbot convert document.tex --format pdf
latex-chatbot version
```

### Method 3: Using UV run with entry point

```bash
uv run latex-chatbot chat "Hello"
```

## Packaging

### Build a distribution package

```bash
cd cli
uv build
```

This creates:
- `dist/latex-chatbot-cli-0.1.0.tar.gz` (source distribution)
- `dist/latex_chatbot_cli-0.1.0-py3-none-any.whl` (wheel)

### Install from built package

```bash
uv pip install dist/latex_chatbot_cli-0.1.0-py3-none-any.whl
```

### Publish to PyPI

```bash
uv publish
```

## Development

The CLI is built using [Click](https://click.palletsprojects.com/), a Python package for creating command-line interfaces.

