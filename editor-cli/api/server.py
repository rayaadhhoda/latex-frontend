import os
import uuid
from pathlib import Path
import sys
import threading
import time

from ag_ui.core.types import RunAgentInput
from langchain_core.messages import HumanMessage, AIMessage
from ag_ui.encoder import EventEncoder
from copilotkit import LangGraphAGUIAgent
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel

from core import __version__, compiler
from core import project
from core import settings
from core.chat.chatbot import create_graph


class SafeLangGraphAGUIAgent(LangGraphAGUIAgent):
    """LangGraphAGUIAgent that tolerates None in messages_in_process (ag_ui_langgraph bug)."""

    def set_message_in_progress(self, run_id: str, data):
        current = self.messages_in_process.get(run_id) or {}
        self.messages_in_process[run_id] = {**(current or {}), **(data or {})}


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


class UpdateFileContentRequest(BaseModel):
    content: str


class ChatRequest(BaseModel):
    dir: str
    prompt: str


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


@app.get("/files/content")
async def get_file_content(dir: str = Query(...), file: str = Query(...)):
    try:
        file_path = Path(dir) / file
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file}")
        if not file_path.is_file():
            raise HTTPException(status_code=400, detail=f"Path is not a file: {file}")
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


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        folder_path = Path(request.dir)
        graph = create_graph(folder_path)
        thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}
        initial_state = {"messages": [HumanMessage(content=request.prompt)]}
        final_state = graph.invoke(initial_state, config=config)
        
        # Extract agent's response messages (AIMessages)
        agent_responses = [
            msg for msg in final_state.get("messages", [])
            if isinstance(msg, AIMessage)
        ]
        
        # Convert AIMessages to serializable format
        response_data = {
            "messages": [
                {
                    "type": msg.__class__.__name__,
                    "content": msg.content,
                    "tool_calls": [
                        {
                            "name": tc.get("name"),
                            "args": tc.get("args"),
                            "id": tc.get("id"),
                        }
                        for tc in (msg.tool_calls or [])
                    ] if hasattr(msg, "tool_calls") and msg.tool_calls else [],
                }
                for msg in agent_responses
            ],
            "full_state": final_state,
        }
        
        print(response_data)
        return {
            "success": True,
            "data": response_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/copilotkit")
@app.post("/copilotkit/")
@app.post("/copilotkit/{path:path}")
async def copilotkit_handler(request: Request, path: str = ""):
    """Handle both CopilotKit info/discovery and AG-UI agent execution."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    method = body.get("method", "")
    inner = body.get("body", {}) or {}

    # AG-UI execution requests are routed via the "method" envelope
    if method and method != "info":
        # The actual AG-UI payload is nested inside "body"
        input_data = RunAgentInput(**inner)
        forwarded_props = input_data.forwarded_props or {}
        folder_path = Path(forwarded_props.get("folder_path", "."))

        graph = create_graph(folder_path)
        agent = SafeLangGraphAGUIAgent(name="0", graph=graph)

        accept_header = request.headers.get("accept")
        encoder = EventEncoder(accept=accept_header)

        async def event_generator():
            async for event in agent.run(input_data):
                yield encoder.encode(event)

        return StreamingResponse(event_generator(),
                                 media_type=encoder.get_content_type())

    # Info / discovery request
    return JSONResponse({
        "agents": [{
            "name": "0",
            "description":
            "A LaTeX chatbot that can read, write, and modify LaTeX files.",
            "type": "langgraph",
        }],
        "actions": [],
        "sdkVersion": __version__,
    })


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
