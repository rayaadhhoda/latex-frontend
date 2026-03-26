from pydantic import BaseModel


class AgentCreds(BaseModel):
    openai_api_key: str
    openai_api_base: str
    openai_api_model: str
    user_email: str
