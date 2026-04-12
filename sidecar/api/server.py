import base64
import os
from pathlib import Path
import sys
import threading
import time

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from platformdirs import user_documents_dir

from core import __version__, compiler
from core import project
from core import settings

if getattr(sys, "frozen", False):
    os.environ.setdefault("PYDANTIC_DISABLE_PLUGINS", "1")


def _start_parent_watcher():
    """Watch parent process and exit if it dies (becomes pid 1 or no longer exists)."""
    parent_pid = os.getppid()

    def watcher():
        while True:
            time.sleep(1)
            current_parent = os.getppid()
            # On Unix, when parent dies, ppid becomes 1 (init/launchd)
            if current_parent != parent_pid or current_parent == 1:
                os._exit(0)

    thread = threading.Thread(target=watcher, daemon=True)
    thread.start()


_start_parent_watcher()


# Request/Response models
class InitRequest(BaseModel):
    dir: str
    template: str = "default"


class CompileRequest(BaseModel):
    dir: str


class UpdateConfigRequest(BaseModel):
    openai_api_base: str | None = None
    openai_api_key: str | None = None
    openai_api_model: str | None = None
    full_name: str | None = None
    workos_refresh_token: str | None = None


class UpdateFileContentRequest(BaseModel):
    content: str


class UploadImageRequest(BaseModel):
    selected_path: str


class UploadImageDataRequest(BaseModel):
    original_filename: str
    media_type: str = "application/octet-stream"
    image_base64: str


class RemoveUploadedImageRequest(BaseModel):
    uploaded_path: str


class MoveImageToProjectRequest(BaseModel):
    uploaded_path: str
    project_dir: str
    target_dir: str = "figures"


class RenameFileRequest(BaseModel):
    dir: str
    from_path: str
    to_path: str


class UsageInfoRequest(BaseModel):
    user_id: str
    n_days_window: int | None = None


SPARTAN_SERVER_URL = os.getenv("SPARTAN_SERVER_URL", "http://127.0.0.1:8767")


app = FastAPI(title="Spartain Write - Sidecar")


@app.get("/health")
async def health():
    return {"status": "ok", "version": __version__}


@app.post("/usage-info")
async def usage_info_proxy(request: UsageInfoRequest):
    body = request.model_dump(exclude_none=True)
    url = f"{SPARTAN_SERVER_URL.rstrip('/')}/usage-info"
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=body)
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Server request failed: {e}",
        ) from e

    if not resp.is_success:
        try:
            err = resp.json()
            detail = err.get("detail", str(err))
        except Exception:
            detail = (resp.text or resp.reason_phrase)[:2000]
        raise HTTPException(status_code=resp.status_code, detail=detail)

    try:
        return resp.json()
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Invalid JSON from server",
        )


@app.get("/templates")
async def get_templates():
    try:
        manifest = project.create.load_manifest()
        return {
            "success": True,
            "data": {
                **manifest, "default_documents_dir": user_documents_dir()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/init")
async def init_project(request: InitRequest):
    try:
        dir_path = Path(request.dir)
        project.create.create_project(dir_path, request.template)
        return {
            "success": True,
            "data": {
                "message": f"Project initialized in {dir_path}"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/compile")
async def compile_project(request: CompileRequest):
    try:
        dir_path = Path(request.dir)
        result = compiler.compile_project(dir_path)
        if result.success:
            return {
                "success": True,
                "data": {
                    "pdf_path":
                    str(result.pdf_path) if result.pdf_path else None,
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                }
            }
        else:
            return {
                "success": False,
                "data": {
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                }
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-image")
async def upload_image(request: UploadImageRequest):
    try:
        original_filename, saved_filename, path, image_bytes = project.image.store_uploaded_image(
            request.selected_path)

        return {
            "success": True,
            "data": {
                "original_filename": original_filename,
                "saved_filename": saved_filename,
                "path": path,
                "image_bytes": image_bytes,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-image-data")
async def upload_image_data(request: UploadImageDataRequest):
    try:
        raw = base64.b64decode(request.image_base64, validate=True)
        if len(raw) > 25 * 1024 * 1024:
            raise ValueError("Image exceeds maximum size (25MB)")
        original_filename, saved_filename, path, image_bytes = (
            project.image.store_uploaded_image_bytes(
                request.original_filename, raw
            )
        )
        return {
            "success": True,
            "data": {
                "original_filename": original_filename,
                "saved_filename": saved_filename,
                "path": path,
                "image_bytes": image_bytes,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/upload-image")
async def delete_uploaded_image(request: RemoveUploadedImageRequest):
    try:
        deleted_path = project.image.remove_uploaded_image(
            request.uploaded_path)
        return {
            "success": True,
            "data": {
                "path": deleted_path,
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/move-image-to-project")
async def move_image_to_project(request: MoveImageToProjectRequest):
    try:
        moved_path = project.image.move_uploaded_image_to_project(
            request.uploaded_path, Path(request.project_dir),
            request.target_dir)
        return {"success": True, "data": {"moved_path": moved_path}}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files")
async def list_files(dir: str = Query(...)):
    try:
        dir_path = Path(dir)
        files = project.read.list_files(dir_path)
        return {"success": True, "data": {"files": files}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/files/content")
async def get_file_content(dir: str = Query(...), file: str = Query(...)):
    try:
        file_path = Path(dir) / file
        if not file_path.exists():
            raise HTTPException(status_code=404,
                                detail=f"File not found: {file}")
        if not file_path.is_file():
            raise HTTPException(status_code=400,
                                detail=f"Path is not a file: {file}")
        content = project.read.read_file(file_path)
        return {"success": True, "data": {"content": content, "file": file}}
    except HTTPException:
        raise
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {file}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/files/content")
async def update_file_content(
        dir: str = Query(...),
        file: str = Query(...),
        request: UpdateFileContentRequest = None,
):
    try:
        file_path = Path(dir) / file
        project.edit.edit_file(file_path, request.content)
        return {"success": True, "data": {"message": f"File updated: {file}"}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/files/content")
async def delete_file_content(dir: str = Query(...), file: str = Query(...)):
    try:
        project.fs_ops.delete_file(Path(dir), file)
        return {"success": True, "data": {"message": f"File deleted: {file}"}}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/files/rename")
async def rename_file(request: RenameFileRequest):
    try:
        project.fs_ops.rename_file(Path(request.dir), request.from_path,
                                   request.to_path)
        return {
            "success": True,
            "data": {
                "message":
                f"Renamed '{request.from_path}' to '{request.to_path}'",
            },
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pdf")
async def get_pdf(dir: str = Query(...)):
    try:
        pdf_path = Path(dir) / "main.pdf"
        if not pdf_path.exists():
            raise HTTPException(status_code=404, detail="main.pdf not found")
        pdf_bytes = pdf_path.read_bytes()
        return Response(content=pdf_bytes, media_type="application/pdf")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/config")
async def get_config(key: str | None = Query(default=None)):
    try:
        if not key:
            config = settings.fetch_all()
            return {"success": True, "data": {"config": dict(config)}}
        else:
            value = settings.fetch_one(key)
            if value is None:
                raise HTTPException(status_code=404,
                                    detail=f"No config found for {key}")
            return {"success": True, "data": {"config": {key: value}}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/config")
async def post_config(request: UpdateConfigRequest):
    try:
        updates = {
            k: v
            for k, v in request.model_dump().items() if v is not None
        }
        config = settings.update_config(updates)
        return {"success": True, "data": {"config": config}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/nuke")
async def nuke_config():
    try:
        settings.nuke.nuke_config()
        return {"success": True, "data": {"message": "Config nuked"}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def main():
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8768)


if __name__ == "__main__":
    main()
