from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .auth_handler import decode_jwt


class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request):
        if request.method == "OPTIONS": # Allow preflight requests to pass through without authentication
            return None
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme.")
            # Log a short summary of the token for debugging (do not log full token in production)
            try:
                token_preview = (credentials.credentials[:16] + '...') if len(credentials.credentials) > 16 else credentials.credentials
            except Exception:
                token_preview = '<unreadable-token>'
            print(f"[auth] Received Bearer token preview={token_preview} length={len(credentials.credentials)}")

            if not self.verify_jwt(credentials.credentials):
                print("[auth] Token verification failed")
                raise HTTPException(status_code=403, detail="Invalid token or expired token.")
            print("[auth] Token verification succeeded")
            return credentials.credentials
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")

    def verify_jwt(self, jwtoken: str) -> bool:
        isTokenValid: bool = False

        try:
            payload = decode_jwt(jwtoken)
        except:
            payload = None
        if payload:
            isTokenValid = True

        return isTokenValid