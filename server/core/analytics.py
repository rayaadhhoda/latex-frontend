import os
from posthog.ai.langchain import CallbackHandler
from posthog import Posthog

from .models import AgentCreds

posthog = Posthog(os.getenv("POSTHOG_API_KEY"),
                  host="https://us.i.posthog.com")


def handle_callback(creds: AgentCreds) -> None:
    return CallbackHandler(
        client=posthog,
        distinct_id=creds.user_email.lower(),
        privacy_mode=False  # optional
    )
