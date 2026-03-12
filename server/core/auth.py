import os
from dataclasses import dataclass
from functools import lru_cache

from fastapi import Request
from workos import WorkOSClient
from workos.exceptions import AuthenticationException, BaseRequestException
from workos.session import _get_jwks_client, jwt
from workos.types.user_management import User


@dataclass
class AuthenticatedSession:
    user_id: str
    user: User


class AuthError(Exception):

    def __init__(self, detail: str, status_code: int = 401):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


@lru_cache(maxsize=1)
def _get_workos_client() -> WorkOSClient:
    api_key = os.getenv("WORKOS_API_KEY")
    client_id = os.getenv("WORKOS_CLIENT_ID")
    if not api_key or not client_id:
        raise AuthError(
            "WorkOS is not configured. Set WORKOS_API_KEY and WORKOS_CLIENT_ID.",
            status_code=500,
        )
    return WorkOSClient(
        api_key=api_key,
        client_id=client_id,
        jwt_leeway=60,  # 60s leeway for clock skew / expiration edge cases
    )


def _extract_bearer_token(request: Request) -> str:
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AuthError(
            "Missing or invalid Authorization header. Expected Bearer token.",
            status_code=401,
        )
    return token


def _is_jwt(token: str) -> bool:
    return token.count(".") == 2


def _authenticate_with_access_token(access_token: str) -> AuthenticatedSession:
    client = _get_workos_client()
    jwks = _get_jwks_client(client.user_management.get_jwks_url())
    try:
        signing_key = jwks.get_signing_key_from_jwt(access_token)
        decoded = jwt.decode(
            access_token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
            leeway=client.jwt_leeway,
        )
    except jwt.exceptions.ExpiredSignatureError as exc:
        raise AuthError("Token expired. Please sign in again.",
                        status_code=401) from exc
    except jwt.exceptions.InvalidTokenError as exc:
        raise AuthError(f"Invalid token: {exc}", status_code=401) from exc
    except (jwt.exceptions.PyJWKClientError, jwt.exceptions.PyJWKError) as exc:
        raise AuthError(f"Token verification failed: {exc}",
                        status_code=401) from exc

    user_id = decoded.get("sub")
    if not user_id:
        raise AuthError("Invalid token: missing subject claim.",
                        status_code=401)

    try:
        user = client.user_management.get_user(user_id)
    except BaseRequestException as exc:
        raise AuthError(f"Authentication service error: {str(exc)}",
                        status_code=502) from exc

    return AuthenticatedSession(user_id=user.id, user=user)


def _authenticate_with_refresh_token(refresh_token: str,
                                     request: Request) -> AuthenticatedSession:
    try:
        response = _get_workos_client(
        ).user_management.authenticate_with_refresh_token(
            refresh_token=refresh_token,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
        )
    except AuthenticationException as exc:
        raise AuthError("Authentication failed.", status_code=401) from exc
    except BaseRequestException as exc:
        if exc.error == "invalid_grant":
            raise AuthError("Authentication failed.", status_code=401) from exc
        raise AuthError(f"Authentication service error: {str(exc)}",
                        status_code=502) from exc

    user = response.user
    return AuthenticatedSession(user_id=user.id, user=user)


def authenticate_request(request: Request) -> AuthenticatedSession:
    token = _extract_bearer_token(request)
    if _is_jwt(token):
        return _authenticate_with_access_token(token)
    return _authenticate_with_refresh_token(token, request)
