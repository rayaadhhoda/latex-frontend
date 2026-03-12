# benchmark

Benchmark tooling and dataset runner for the Spartan-Write project.

## CLI

### `benchmark`

- **Help**: `uv run benchmark --help`
- **Options**
  - **`--dir <DIRECTORY>`**: Benchmark working directory (defaults to current working directory).
- **Commands**
  - **`run`**: Run benchmarks.
    - **Flags**
      - **`--new-only`**: Run benchmarks only for new dataset entries (preserves existing runs).
  - **`dashboard`**: Serve the Streamlit dashboard for benchmark results.

Examples:

```bash
uv run benchmark --dir /path/to/benchmark run
uv run benchmark --dir /path/to/benchmark run --new-only
uv run benchmark --dir /path/to/benchmark dashboard
```

### `dashboard`

The package also exposes a standalone dashboard entrypoint:

```bash
uv run dashboard --dir /path/to/benchmark
```
