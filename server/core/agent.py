import base64
import mimetypes
from pathlib import Path
from textwrap import dedent

from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.state import CompiledStateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt
from copilotkit import CopilotKitState

from .local_tools import create_local_tools
from .models import AgentCreds
from .analytics import handle_callback

SYSTEM_PROMPT = dedent(
    """ You are a helpful LaTeX assistant that can read, write, and modify LaTeX files 
        based on user requests. You have access to tools that allow you to:
        1. List files in the project directory
        2. Read the contents of any file
        3. Edit/write the contents of any file
        4. Compile the LaTeX project
        5. Move the currently attached image into the project's figures directory
        6. Delete a file from the project directory
        7. Rename or move a file within the project directory

        # Workflow
        When a user asks you to modify LaTeX files, you should:
        - First, list files to understand the project structure if needed
        - Read relevant files to understand the current content
        - Make the requested changes
        - Write the updated content back to the file
        - If you rename or move a file, update \\input, \\include, bibliography, and figure paths that reference the old path
        - Compile the LaTeX project to check for errors
        - If the compilation fails, you should try to fix the error.
        - However, do not attempt to compile or fix compilation errors more than three times within a single user request.
        - Always be careful to preserve LaTeX syntax and formatting.
        - When editing files, provide the complete file content, not just the changed sections.

        # Image attachments
        - When the user wants an attached image to become part of the LaTeX project (figure, appendix image, etc.), use the move_attached_image_to_project tool to place it under figures/, then add or update \\includegraphics and related LaTeX in the right file(s).
        - When the user wants information taken from an attached image (describe it, transcribe text, answer what it shows, extract a table, etc.), answer using the image as it appears in the conversation (vision). Do not use a tool to "load" the image for that purpose.
        - If it is unclear whether they want the image saved into the project or only analyzed, ask a brief clarifying question before moving files or editing the document structure.

        # Integrity Checks
        You must always aim to make minimal changes to the project. Do not add content that is not provided by the user.
        All content will be provided by the user. Even if asked to generate text, insist that the user provides the content.

        # Directory structure
        The given folder is the root of the LaTeX project.
        - The project should have a main.tex file.
          This is the top level file that is compiled.
          It should use \\input to include other files.
          None of the section Contents should be directly in the main.tex file.
        - The project should have a refs.bib file.
          This is the bibliography file.
          It should be referenced in the main.tex file using \\bibliography{refs}.
        - The project should have a figures/ directory.
          This is the directory for the figures.
          Figures are referenced in the sections as requested by the user.
          Use the following syntax: 
            \\begin{figure}[htbp]
            \\centerline{\\includegraphics[width=1.1\\linewidth]{figures/fig2.png}}
            \\caption{Figure caption}
            \\label{figure_label}
            \\end{figure}
        - The project should have a `tables/` directory.
          Tables are referenced in the sections as requested by the user.
        - The project should have a `sections/` directory.
          Sections are referenced in the main.tex file using \\input{sections/section_name}.
          All of the text content goes in the sections.
          If there are subsections, each subsection MUST be in a separate file. Use the tools to rearrange the files as text is added.
          For example, for section "1.1 Introduction", the file should be called `introduction.tex`.
          Then, `introduction.tex` is imported in main.tex using \\input{sections/introduction}.

        If you understand, reply with "Let's get started!"

        IMPORTANT: You must use the provided tools (function calling) to perform actions.
        Never output tool calls as text or XML tags. Use the actual tool/function API.
        """).strip()


def create_model(creds: AgentCreds):
    if not creds.openai_api_key:
        raise ValueError("API key not configured.")

    return ChatOpenAI(
        default_headers={
            'X-Title': 'Spartan Write',
            'HTTP-Referer': 'https://vivekraman.dev/blog/spartan-write',
        },
        model=creds.openai_api_model,
        api_key=creds.openai_api_key,
        base_url=creds.openai_api_base,
    )


# Schema-only tools for CopilotKit path. Names/schemas must match frontend useFrontendTool.
# Execution happens on the frontend; we only need the model to output structured tool calls.
FRONTEND_TOOL_SCHEMAS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "list_files_tool",
            "description": "List all files in the project directory.",
            "parameters": {
                "type": "object",
                "properties": {}
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "read_file_tool",
            "description":
            "Read the contents of a file in the project directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type":
                        "string",
                        "description":
                        "Relative path to the file from the project root (e.g., 'main.tex' or 'refs.bib')",
                    },
                },
                "required": ["file_path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "edit_file_tool",
            "description": "Edit or create a file in the project directory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type":
                        "string",
                        "description":
                        "Relative path to the file from the project root (e.g., 'main.tex' or 'refs.bib')",
                    },
                    "content": {
                        "type": "string",
                        "description":
                        "The complete content to write to the file",
                    },
                },
                "required": ["file_path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_file_tool",
            "description":
            "Delete a file from the project directory. Does not delete directories.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type":
                        "string",
                        "description":
                        "Relative path to the file from the project root (e.g., 'sections/old.tex')",
                    },
                },
                "required": ["file_path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "rename_file_tool",
            "description":
            "Rename or move a file within the project directory (same as moving to a new relative path).",
            "parameters": {
                "type": "object",
                "properties": {
                    "from_path": {
                        "type":
                        "string",
                        "description":
                        "Current relative path of the file from the project root",
                    },
                    "to_path": {
                        "type":
                        "string",
                        "description":
                        "New relative path for the file from the project root",
                    },
                },
                "required": ["from_path", "to_path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "compile_latex_tool",
            "description": "Compile the LaTeX project.",
            "parameters": {
                "type": "object",
                "properties": {}
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "move_attached_image_to_project_tool",
            "description":
            "Move the currently attached image into the project's figures directory.",
            "parameters": {
                "type": "object",
                "properties": {}
            },
        },
    },
]


def _content_has_image_url_block(content: object) -> bool:
    if not isinstance(content, list):
        return False
    for block in content:
        if isinstance(block, dict) and block.get("type") == "image_url":
            return True
    return False


def _data_url_for_image_file(path: Path) -> str | None:
    try:
        raw = path.read_bytes()
    except OSError:
        return None
    mime, _ = mimetypes.guess_type(str(path))
    if not mime or not mime.startswith("image/"):
        ext = path.suffix.lower()
        fallback = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".bmp": "image/bmp",
            ".svg": "image/svg+xml",
        }
        mime = fallback.get(ext, "image/png")
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:{mime};base64,{b64}"


def _inject_attached_image_into_messages(
    messages: list[BaseMessage],
    attached_image_path: str | None,
) -> list[BaseMessage]:
    """Append vision input for the staged attachment to the latest HumanMessage."""
    if not attached_image_path:
        return messages
    path = Path(attached_image_path)
    if not path.is_file():
        return messages
    data_url = _data_url_for_image_file(path)
    if not data_url:
        return messages

    out = list(messages)
    for i in range(len(out) - 1, -1, -1):
        msg = out[i]
        if not isinstance(msg, HumanMessage):
            continue
        if _content_has_image_url_block(msg.content):
            break
        image_block: dict = {
            "type": "image_url",
            "image_url": {"url": data_url},
        }
        content = msg.content
        if isinstance(content, str):
            new_content: list | str = [
                {"type": "text", "text": content},
                image_block,
            ]
        elif isinstance(content, list):
            new_content = list(content) + [image_block]
        else:
            new_content = [
                {"type": "text", "text": str(content)},
                image_block,
            ]
        if hasattr(msg, "model_copy"):
            out[i] = msg.model_copy(update={"content": new_content})
        else:
            out[i] = HumanMessage(content=new_content)
        break
    return out


def create_graph(creds: AgentCreds,
                 folder_path: Path,
                 attached_image_path: str | None,
                 local_execution: bool = False) -> CompiledStateGraph:
    """Create and return a configured LangGraph agent.

    When local_execution is True, server-side tools are bound to the model and
    included in the graph.  When False (CopilotKit path), schema-only tools are
    always bound so the model outputs structured tool calls; execution is on the frontend.
    """
    model = create_model(creds)

    if local_execution:
        tools = create_local_tools(folder_path, attached_image_path)
        model_with_tools = model.bind_tools(tools)
    else:
        # CopilotKit path: always bind schema-only tools so model uses function calling
        model_with_tools = model.bind_tools(FRONTEND_TOOL_SCHEMAS)

    def call_model(state: CopilotKitState):
        augmented = _inject_attached_image_into_messages(
            state["messages"], attached_image_path)
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + augmented
        return {
            "messages": [
                model_with_tools.invoke(
                    messages, config={"callbacks": [handle_callback(creds)]})
            ]
        }

    def should_continue_after_agent(state: CopilotKitState) -> str:
        """Route to frontend_tools if last message has tool_calls, else END."""
        messages = state.get("messages") or []
        if not messages:
            return "end"
        last = messages[-1]
        if isinstance(last, AIMessage) and last.tool_calls:
            return "frontend_tools"
        return "end"

    def frontend_tools_node(state: CopilotKitState):
        """Interrupt for frontend to execute tools, then add ToolMessages on resume."""
        messages = state["messages"]
        last = messages[-1]
        tool_calls = last.tool_calls
        # Interrupt: frontend executes tools and sends result via resolve()
        result = interrupt({
            "tool_calls": [{
                "id": tc["id"],
                "name": tc["name"],
                "args": tc.get("args", {})
            } for tc in tool_calls],
        })
        # Resume: result is list of {tool_call_id, content} or list of strings
        tool_messages = []
        if isinstance(result, list):
            for i, tc in enumerate(tool_calls):
                item = result[i] if i < len(result) else ""
                content = item.get("content", item) if isinstance(
                    item, dict) else str(item)
                tool_messages.append(
                    ToolMessage(tool_call_id=tc["id"], content=content))
        elif isinstance(result, dict):
            for tc in tool_calls:
                content = result.get(tc["id"], result.get("content", ""))
                tool_messages.append(
                    ToolMessage(tool_call_id=tc["id"], content=str(content)))
        else:
            # Single tool, result is the content string
            tool_messages.append(
                ToolMessage(tool_call_id=tool_calls[0]["id"],
                            content=str(result)))
        return {"messages": tool_messages}

    workflow = StateGraph(CopilotKitState)
    workflow.add_node("agent", call_model)
    workflow.add_edge(START, "agent")

    if local_execution:
        workflow.add_node("tools", ToolNode(tools))
        workflow.add_conditional_edges("agent", tools_condition)
        workflow.add_edge("tools", "agent")
    else:
        workflow.add_node("frontend_tools", frontend_tools_node)
        workflow.add_conditional_edges("agent", should_continue_after_agent, {
            "frontend_tools": "frontend_tools",
            "end": END
        })
        workflow.add_edge("frontend_tools", "agent")

    memory = MemorySaver()
    graph = workflow.compile(checkpointer=memory)

    return graph
