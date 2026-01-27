from pathlib import Path
from dataclasses import dataclass
import subprocess
import platform


@dataclass
class CompileResult:
    """Result of a LaTeX compilation."""
    success: bool
    pdf_path: Path | None
    stdout: str
    stderr: str


def _validate_main_tex(dir: Path) -> None:
    """Validate that main.tex exists in the directory."""
    main_tex = dir / "main.tex"
    if not main_tex.exists():
        raise FileNotFoundError(f"main.tex not found in {dir}")


def _get_target_triple() -> str:
    """Return the target triple for the current platform."""
    system = platform.system().lower()
    machine = platform.machine().lower()

    if system == "darwin":
        if machine == "arm64":
            return "aarch64-apple-darwin"
        return "x86_64-apple-darwin"
    elif system == "windows":
        if machine == "amd64" or machine == "x86_64":
            return "x86_64-pc-windows-msvc"
        return "i686-pc-windows-msvc"
    elif system == "linux":
        if machine == "aarch64":
            return "aarch64-unknown-linux-gnu"
        return "x86_64-unknown-linux-gnu"
    else:
        raise RuntimeError(f"Unsupported platform: {system}/{machine}")


def _run_tectonic(
    tectonic_path: Path,
    input_file: Path,
    output_dir: Path,
    timeout: int,
    keep_logs: bool = False,
    synctex: bool = False,
    print_output: bool = False,
) -> subprocess.CompletedProcess:
    """Run the Tectonic compiler on the input file.

    Args:
        tectonic_path: Path to the Tectonic binary
        input_file: Path to the main .tex file
        output_dir: Directory for output files
        timeout: Compilation timeout in seconds
        keep_logs: Whether to keep log files
        synctex: Whether to generate SyncTeX data
        print_output: Whether to print engine output during processing

    Returns:
        CompletedProcess with stdout and stderr captured
    """
    cmd = [
        str(tectonic_path.absolute()),
        "-X",
        "compile",
        str(input_file),
        "--outdir",
        str(output_dir),
    ]

    if keep_logs:
        cmd.append("--keep-logs")

    if synctex:
        cmd.append("--synctex")

    if print_output:
        cmd.append("--print")

    print(' '.join(cmd))

    return subprocess.run(
        cmd,
        cwd=output_dir,
        capture_output=True,
        text=True,
        timeout=timeout,
    )


def compile_project(
    dir: Path,
    timeout: int = 60,
    keep_logs: bool = False,
    synctex: bool = False,
) -> CompileResult:
    """Compile a LaTeX project using Tectonic and return the result.

    Args:
        dir: Directory containing LaTeX project files
        timeout: Compilation timeout in seconds (default: 60)
        keep_logs: Whether to keep log files (default: False)
        synctex: Whether to generate SyncTeX data (default: False)

    Returns:
        CompileResult with success status, PDF path, and output streams
    """
    _validate_main_tex(dir)
    target_triple = _get_target_triple()
    tectonic_bin = Path(f"./bin/tectonic-{target_triple}")

    main_tex = dir / "main.tex"
    pdf_path = dir / "main.pdf"

    try:
        result = _run_tectonic(
            tectonic_path=tectonic_bin,
            input_file=main_tex,
            output_dir=dir,
            timeout=timeout,
            keep_logs=keep_logs,
            synctex=synctex,
        )

        success = result.returncode == 0
        return CompileResult(
            success=success,
            pdf_path=pdf_path if success and pdf_path.exists() else None,
            stdout=result.stdout,
            stderr=result.stderr,
        )

    except subprocess.TimeoutExpired as e:
        return CompileResult(
            success=False,
            pdf_path=None,
            stdout=e.stdout if e.stdout else "",
            stderr=f"Compilation timed out after {timeout} seconds",
        )
    except Exception as e:
        return CompileResult(
            success=False,
            pdf_path=None,
            stdout="",
            stderr=str(e),
        )
