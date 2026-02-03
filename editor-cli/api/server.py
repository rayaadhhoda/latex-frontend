import os
from pathlib import Path
import sys
import threading
import time

from copilotkit import CopilotKitRemoteEndpoint, LangGraphAgent
from copilotkit.integrations.fastapi import add_fastapi_endpoint as add_copilotkit_fastapi_endpoint
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from core import __version__, compiler
from core import project
from core import settings
from core.chat.chatbot import create_graph

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


app = FastAPI(title="LaTeX Chatbot API")


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


@app.get("/files")
async def list_files(dir: str = Query(...)):
    try:
        dir_path = Path(dir)
        files = project.read.list_files(dir_path)
        return {"success": True, "data": {"files": files}}
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


def get_agents(context):
    """Dynamically create agents based on request context."""
    # Get folder_path from context properties (sent by frontend)
    properties = context.get("properties", {})
    folder_path = Path(properties.get("folder_path", "."))
    print(folder_path, 'asdasd')

    return [
        LangGraphAgent(
            graph=create_graph(folder_path),
            name="latex-chatbot",
        )
    ]


# CopilotKit runtime endpoint with dynamic agent creation
runtime = CopilotKitRemoteEndpoint(agents=get_agents)
add_copilotkit_fastapi_endpoint(fastapi_app=app,
                                sdk=runtime,
                                prefix="/copilotkit")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def main():
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765)


if __name__ == "__main__":
    main()
