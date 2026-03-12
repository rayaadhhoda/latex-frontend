from pathlib import Path
from textwrap import dedent

from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.state import CompiledStateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt
from copilotkit import CopilotKitState
from pydantic import BaseModel

from .local_tools import create_local_tools


class AgentCreds(BaseModel):
    openai_api_key: str
    openai_api_base: str
    openai_api_model: str


SYSTEM_PROMPT = dedent(
    """ You are a helpful LaTeX assistant that can read, write, and modify LaTeX files 
        based on user requests. You have access to tools that allow you to:
        1. List files in the project directory
        2. Read the contents of any file
        3. Edit/write the contents of any file
        4. Compile the LaTeX project
        5. Read the currently attached image and return bytes as base64 ASCII
        6. Move the currently attached image into the project's figures directory

        # Workflow
        When a user asks you to modify LaTeX files, you should:
        - First, list files to understand the project structure if needed
        - Read relevant files to understand the current content
        - Make the requested changes
        - Write the updated content back to the file
        - Compile the LaTeX project to check for errors
        - If the compilation fails, you should try to fix the error.
        - However, do not attempt to compile or fix compilation errors more than three times within a single user request.
        - Always be careful to preserve LaTeX syntax and formatting.
        - When editing files, provide the complete file content, not just the changed sections.

        # Figure Handling
        - If the user asks you to add a figure, you should use the move_attached_image_to_project tool to move it to the project's figures directory, then cite it in the right location.
        - If the user instead asks a question about the figure, you should use the read_attached_image_tool to read the image and then answer the question based on the image.

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
          If there are subsections, each subsection should be in a separate file.
          For example, for section "1.1 Introduction", the file should be called `1_1_introduction.tex`.
          Then, `1_1_introduction.tex` is imported in main.tex using \\input{sections/1_1_introduction}.

        If you understand, reply with "Let's get started!"

        IMPORTANT: You must use the provided tools (function calling) to perform actions.
        Never output tool calls as text or XML tags. Use the actual tool/function API.
        """).strip()


def create_model(creds: AgentCreds):
    if not creds.openai_api_key:
        raise ValueError("OpenAI API key not configured.")

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
            "name": "compile_latex_tool",
            "description": "Compile the LaTeX project.",
            "parameters": {
                "type": "object",
                "properties": {}
            },
        },
    },
    # {
    #     "type": "function",
    #     "function": {
    #         "name": "read_attached_image_tool",
    #         "description":
    #         "Read the currently attached image and return its base64-encoded bytes.",
    #         "parameters": {
    #             "type": "object",
    #             "properties": {}
    #         },
    #     },
    # },
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
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
        return {"messages": [model_with_tools.invoke(messages)]}

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
