from pathlib import Path
from textwrap import dedent
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, START
from langgraph.graph.state import CompiledStateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from copilotkit import CopilotKitState
from core.compiler import compile_project

from core.project.read import read_file, list_files
from core.project.edit import edit_file
from core.project.image import (
    get_uploaded_image_bytes_b64,
    move_uploaded_image_to_project,
)
from core import settings

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
        """).strip()


def create_tools(folder_path: Path, attached_image_path: str | None):
    """Create tools bound to a specific folder path."""

    @tool
    def read_file_tool(file_path: str) -> str:
        """Read the contents of a file in the project directory.
        
        Args:
            file_path: Relative path to the file from the project root (e.g., 'main.tex' or 'refs.bib')
        """
        full_path = folder_path / file_path
        if not full_path.exists():
            return f"Error: File '{file_path}' does not exist in the project directory."
        if not full_path.is_file():
            return f"Error: '{file_path}' is not a file."
        try:
            return read_file(full_path)
        except Exception as e:
            return f"Error reading file '{file_path}': {str(e)}"

    @tool
    def edit_file_tool(file_path: str, content: str) -> str:
        """Edit or create a file in the project directory.
        
        Args:
            file_path: Relative path to the file from the project root (e.g., 'main.tex' or 'refs.bib')
            content: The complete content to write to the file
        """
        full_path = folder_path / file_path
        try:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            edit_file(full_path, content)
            return f"Successfully updated '{file_path}'."
        except Exception as e:
            return f"Error writing to file '{file_path}': {str(e)}"

    @tool
    def list_files_tool(recursive: bool = True) -> str:
        """List all files in the project directory.
        
        Args:
            recursive: If True, list files recursively in subdirectories. If False, only list files in the root directory.
        """
        files = list_files(folder_path, recursive=recursive)
        if not files:
            return "No files found in the project directory."
        file_list = "\n".join(f"  - {f}" for f in files)
        return f"Files in project directory:\n{file_list}"

    @tool
    def compile_latex_tool() -> str:
        """Compile the LaTeX project."""
        result = compile_project(folder_path)
        if result.success:
            return "SUCCESS"
        print(result.stderr)
        return f"FAILED: {result.stderr}"

    @tool
    def read_attached_image_tool():
        """Read the currently attached image and return an image-part style message."""
        if not attached_image_path:
            return [{
                "type": "text",
                "text": "Error: No image is currently attached."
            }]

        try:
            image_b64 = get_uploaded_image_bytes_b64(attached_image_path)
        except Exception as e:
            return [{
                "type": "text",
                "text": f"Error reading attached image: {str(e)}",
            }]

        suffix = Path(attached_image_path).suffix.lower()
        media_type = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }.get(suffix, "image/png")

        return [{
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": image_b64,
            },
        }]

    @tool
    def move_attached_image_to_project_tool() -> str:
        """Move the currently attached image into the project's figures directory."""
        if not attached_image_path:
            return "Error: No image is currently attached."
        try:
            moved_relative_path = move_uploaded_image_to_project(
                attached_image_path, folder_path)
            return f"Moved attached image to '{moved_relative_path}'."
        except Exception as e:
            return f"Error moving attached image into project: {str(e)}"

    return [
        read_file_tool,
        edit_file_tool,
        list_files_tool,
        compile_latex_tool,
        read_attached_image_tool,
        move_attached_image_to_project_tool,
    ]


def create_model():
    """Create the ChatOpenAI model configured for OpenRouter."""
    config = settings.fetch_all()
    api_key = config.get('openai_api_key', '')
    api_model = config.get('openai_api_model', 'gpt-4o-mini')

    if not api_key:
        raise ValueError("OpenAI API key not configured.")

    return ChatOpenAI(
        default_headers={
            'X-Title': 'LaTeX Chatbot',
            'HTTP-Referer': 'https://vivekraman.dev/blog/latex-chatbot',
        },
        model=api_model,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
    )


def create_graph(folder_path: Path,
                 attached_image_path: str | None) -> CompiledStateGraph:
    """Create and return a configured LangGraph agent."""
    model = create_model()
    tools = create_tools(folder_path, attached_image_path)
    model_with_tools = model.bind_tools(tools)

    def call_model(state: CopilotKitState):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
        return {"messages": [model_with_tools.invoke(messages)]}

    workflow = StateGraph(CopilotKitState)
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", ToolNode(tools))
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges("agent", tools_condition)
    workflow.add_edge("tools", "agent")

    memory = MemorySaver()
    graph = workflow.compile(checkpointer=memory)

    return graph
