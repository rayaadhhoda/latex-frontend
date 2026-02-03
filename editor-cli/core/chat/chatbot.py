from pathlib import Path
from textwrap import dedent
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
from core.project.read import read_file, list_files
from core.project.edit import edit_file
from core import settings
from typing import TypedDict


class ProjectContext(TypedDict):
    folder_path: Path


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


def create_agent() -> Agent[ProjectContext, str]:
    """Create and return a configured agent instance."""
    # Load API configuration
    config = settings.fetch_all()
    api_key = config.get('openai_api_key', '')
    api_model = config.get('openai_api_model', 'gpt-4o-mini')

    if not api_key:
        raise ValueError(
            "OpenAI API key not configured. Please run 'init' to setup.")

    # Create custom OpenAI model with custom base URL
    model = OpenRouterModel(
        provider=OpenRouterProvider(api_key=api_key),
        model_name=api_model,
    )

    # Create agent with system prompt
    agent = Agent(
        name="latex-chatbot",
        model=model,
        deps_type=ProjectContext,
        system_prompt=SYSTEM_PROMPT,
    )

    # Define tools
    @agent.tool(
        name="read_file_tool",
        description="Read the contents of a file in the project directory.")
    def read_file_tool(ctx: RunContext[ProjectContext], file_path: str) -> str:
        """Read the contents of a file in the project directory.
        
        Args:
            file_path: Relative path to the file from the project root (e.g., 'main.tex' or 'refs.bib')
        
        Returns:
            The contents of the file as a string.
        """
        full_path = ctx.deps['folder_path'] / file_path
        if not full_path.exists():
            return f"Error: File '{file_path}' does not exist in the project directory."
        if not full_path.is_file():
            return f"Error: '{file_path}' is not a file."
        try:
            return read_file(full_path)
        except Exception as e:
            return f"Error reading file '{file_path}': {str(e)}"

    @agent.tool(name="edit_file_tool",
                description="Edit or create a file in the project directory.")
    def edit_file_tool(ctx: RunContext[ProjectContext], file_path: str,
                       content: str) -> str:
        """Edit or create a file in the project directory.
        
        Args:
            file_path: Relative path to the file from the project root (e.g., 'main.tex' or 'refs.bib')
            content: The complete content to write to the file
        
        Returns:
            A success message or error description.
        """
        full_path = ctx.deps['folder_path'] / file_path
        try:
            # Ensure parent directory exists
            full_path.parent.mkdir(parents=True, exist_ok=True)
            edit_file(full_path, content)
            return f"Successfully updated '{file_path}'."
        except Exception as e:
            return f"Error writing to file '{file_path}': {str(e)}"

    @agent.tool(name="list_files_tool",
                description="List all files in the project directory.")
    def list_files_tool(ctx: RunContext[ProjectContext],
                        recursive: bool = True) -> str:
        """List all files in the project directory.
        
        Args:
            recursive: If True, list files recursively in subdirectories. If False, only list files in the root directory.
        
        Returns:
            A formatted string listing all files in the directory.
        """
        files = list_files(ctx.deps['folder_path'], recursive=recursive)
        if not files:
            return "No files found in the project directory."
        file_list = "\n".join(f"  - {f}" for f in files)
        return f"Files in project directory:\n{file_list}"

    return agent


def chat_with_project(folder_path: Path, message: str) -> str:
    """Chat with the LaTeX chatbot to perform file operations."""
    agent = create_agent()
    context: ProjectContext = {'folder_path': folder_path}
    result = agent.run_sync(message, deps=context)
    return result.output
