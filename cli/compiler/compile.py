from pathlib import Path
import json
import urllib.request
import urllib.error
import hashlib
import click


def _generate_project_id(dir: Path) -> str:
    """Generate a project ID based on directory path hash."""
    return hashlib.md5(str(dir.absolute()).encode()).hexdigest()


def _validate_main_tex(dir: Path) -> None:
    """Validate that main.tex exists in the directory."""
    main_tex = dir / "main.tex"
    if not main_tex.exists():
        raise FileNotFoundError(f"main.tex not found in {dir}")


def _collect_resources(dir: Path) -> list:
    """Collect all files in the directory as resources for compilation."""
    resources = []
    for file_path in sorted(dir.iterdir()):
        if file_path.is_file():
            try:
                content = file_path.read_text(encoding='utf-8')
                relative_path = file_path.name
                resources.append({"path": relative_path, "content": content})
            except UnicodeDecodeError:
                click.echo(f"+ Skipping binary file: {file_path.name}",
                           err=True)
                continue
    return resources


def _build_compile_payload(resources: list, compiler: str,
                           timeout: int) -> dict:
    """Build the compile request payload."""
    return {
        "compile": {
            "options": {
                "compiler": compiler,
                "timeout": timeout
            },
            "rootResourcePath": "main.tex",
            "resources": resources
        }
    }


def _make_compile_request(url: str, payload: dict, timeout: int) -> dict:
    """Make the compile API request and return the response data."""
    json_data = json.dumps(payload).encode('utf-8')
    request = urllib.request.Request(
        url,
        data=json_data,
        headers={'Content-Type': 'application/json'},
        method='POST')

    print(json_data)
    with urllib.request.urlopen(request, timeout=timeout + 10) as response:
        return json.loads(response.read().decode('utf-8'))


def _fetch_output_content(output_files: list, output_type: str) -> str:
    """Fetch content from output files URL by type (stdout, stderr, etc.)."""
    output_file = next(
        (f for f in output_files if f.get("type") == output_type), None)

    if not output_file:
        return ""

    output_url = output_file.get("url")
    if not output_url:
        return ""

    try:
        with urllib.request.urlopen(output_url, timeout=10) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        return f"Failed to fetch {output_type}: {str(e)}"


def _fetch_stderr_content(output_files: list) -> str:
    """Fetch stderr content from the output files URL."""
    return _fetch_output_content(output_files, "stderr")


def _fetch_stdout_content(output_files: list) -> str:
    """Fetch stdout content from the output files URL."""
    return _fetch_output_content(output_files, "stdout")


def _handle_success(compile_result: dict, response_data: dict) -> str:
    """Handle successful compilation and return PDF URL."""
    output_files = compile_result.get("outputFiles", [])
    pdf_file = next((f for f in output_files if f.get("type") == "pdf"), None)

    if pdf_file:
        pdf_url = pdf_file.get("url")
        click.echo(f"+ Compilation successful!")
        click.echo(f"+ PDF available at: {pdf_url}")
        return pdf_url
    else:
        click.echo("+ Compilation successful but no PDF found in output files",
                   err=True)
        return json.dumps(response_data, indent=2)


def _handle_failure(compile_result: dict, response_data: dict) -> str:
    """Handle failed compilation and return error details."""
    error_message = compile_result.get("error", "Unknown error")
    output_files = compile_result.get("outputFiles", [])
    stdout_contents = _fetch_stdout_content(output_files)
    stderr_contents = _fetch_stderr_content(output_files)

    print(compile_result)
    click.echo(f"+ Compilation failed: {error_message}", err=True)
    if stdout_contents:
        click.echo(f"+ Output: {stdout_contents}", err=True)
    if stderr_contents:
        click.echo(f"+ Error: {stderr_contents}", err=True)
    return json.dumps(response_data, indent=2)


def compile_project(dir: Path,
                    clsi_url: str = "http://localhost:3013",
                    compiler: str = "pdflatex",
                    timeout: int = 60) -> str:
    """Compile a LaTeX project using CLSI API and return the output.

    Args:
        dir: Directory containing LaTeX project files
        clsi_url: Base URL for CLSI service (default: http://localhost:3013)
        compiler: LaTeX compiler to use (latex, pdflatex, xelatex, lualatex)
        timeout: Compilation timeout in seconds (default: 60)

    Returns:
        String containing compilation result (PDF URL on success, error message on failure)
    """
    _validate_main_tex(dir)
    project_id = _generate_project_id(dir)
    resources = _collect_resources(dir)
    payload = _build_compile_payload(resources, compiler, timeout)

    url = f"{clsi_url}/project/{project_id}/compile"

    try:
        response_data = _make_compile_request(url, payload, timeout)
        compile_result = response_data.get("compile", {})
        status = compile_result.get("status")

        if status == "success":
            return _handle_success(compile_result, response_data)
        else:
            return _handle_failure(compile_result, response_data)

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else "No error details"
        click.echo(f"+ HTTP Error {e.code}: {error_body}", err=True)
        raise
    except urllib.error.URLError as e:
        click.echo(f"+ Connection error: {e.reason}", err=True)
        click.echo(f"+ Make sure CLSI is running at {clsi_url}", err=True)
        raise
    except Exception as e:
        click.echo(f"+ Error: {str(e)}", err=True)
        raise
