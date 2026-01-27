from pathlib import Path
import os
import sys
import threading
import time

if getattr(sys, "frozen", False):
    os.environ.setdefault("PYDANTIC_DISABLE_PLUGINS", "1")

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core import __version__, compiler
from core import project
from core import settings
from core.chat import chatbot


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

app = FastAPI(title="LaTeX Chatbot API", version=__version__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class InitRequest(BaseModel):
    dir: str
    template: str = "default"


class CompileRequest(BaseModel):
    dir: str


class ChatRequest(BaseModel):
    dir: str
    query: str


class UpdateConfigRequest(BaseModel):
    openai_api_base: str | None = None
    openai_api_key: str | None = None
    openai_api_model: str | None = None
    full_name: str | None = None


# Startup event
@app.on_event("startup")
async def startup():
    if settings.first_run.is_first_run():
        settings.first_run.setup_first_run()


# Endpoints
@app.get("/health")
async def health():
    return {"status": "ok", "version": __version__}


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
        return {
            "success": True,
            "data": {
                "result": str(result) if result else "Compilation complete"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        dir_path = Path(request.dir)
        response = chatbot.chat_with_project(dir_path, request.query)
        return {"success": True, "data": {"response": response}}
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


@app.get("/config")
async def get_config(key: str | None = Query(default=None)):
    try:
        if not key:
            config = settings.fetch_all()
            if not config:
                raise HTTPException(status_code=404, detail="No config found")
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


def main():
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765)


if __name__ == "__main__":
    main()
