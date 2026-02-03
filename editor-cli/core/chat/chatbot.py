from pathlib import Path
from textwrap import dedent

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.agents import create_agent
from langgraph.graph.state import CompiledStateGraph

from core.project.read import read_file, list_files
from core.project.edit import edit_file
from core import settings


SYSTEM_PROMPT = dedent(
    """You are a helpful LaTeX assistant that can read, write, and modify LaTeX files 
        based on user requests. You have access to tools that allow you to:
        1. List files in the project directory
        2. Read the contents of any file
        3. Edit/write the contents of any file

        When a user asks you to modify LaTeX files, you should:
        - First, list files to understand the project structure if needed
        - Read relevant files to understand the current content
        - Make the requested changes
        - Write the updated content back to the file

        Always be careful to preserve LaTeX syntax and formatting. When editing files, provide the complete 
        file content, not just the changed sections.""")


def create_tools(folder_path: Path):
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

    return [read_file_tool, edit_file_tool, list_files_tool]


def create_model():
    """Create the ChatOpenAI model configured for OpenRouter."""
    config = settings.fetch_all()
    api_key = config.get('openai_api_key', '')
    api_model = config.get('openai_api_model', 'gpt-4o-mini')

    if not api_key:
        raise ValueError(
            "OpenAI API key not configured. Please run 'init' to setup.")

    return ChatOpenAI(
        model=api_model,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
    )


def create_graph(folder_path: Path) -> CompiledStateGraph:
    """Create and return a configured LangGraph agent."""
    model = create_model()
    tools = create_tools(folder_path)
    
    graph = create_agent(
        model,
        tools=tools,
        system_prompt=SYSTEM_PROMPT,
    )
    
    return graph


def chat_with_project(folder_path: Path, message: str) -> str:
    """Chat with the LaTeX chatbot to perform file operations."""
    graph = create_graph(folder_path)
    result = graph.invoke({"messages": [("user", message)]})
    # Get the last AI message
    ai_messages = [m for m in result["messages"] if hasattr(m, 'type') and m.type == "ai"]
    if ai_messages:
        return ai_messages[-1].content
    return ""
