# LaTeX Chatbot Benchmark

A CLI tool for evaluating the performance and accuracy of the LaTeX chatbot agents.

## Functionality

The benchmark tool runs a suite of predefined tasks against the chatbot agent to measure:
- **Success Rate**: Can the agent correctly invoke the compiler and produce a valid PDF?
- **Correction Capability**: Can the agent fix intentionally broken LaTeX code?
- **Generation Quality**: (Subjective/Heuristic) specific checks on generated content.

## Usage

### Run Benchmarks

```bash
# From project root
make do-benchmark
```

Or manually:

```bash
cd benchmark
uv run benchmark --dir temp run
```

### Workflow

1.  **Locate Server**: Ensures the backend server is running or reachable.
2.  **Load Dataset**: Reads benchmark definitions from `data/`.
3.  **Clone Dataset**: Sets up a temporary workspace for each test case.
4.  **Run**: Executes each test case and reports results.

## Configuration

Benchmark behavior can be rendered via CLI flags. Use `--help` for more options:

```bash
uv run benchmark --help
```
