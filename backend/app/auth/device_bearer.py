from fastapi import Depends, Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session
import hashlib

from app.auth.auth_bearer import JWTBearer
from app.database import SessionLocal, get_db
from app.models import Device, User


class DeviceBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> Device:
        print("DeviceBearer called")
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)
        print(f"Credentials received: {credentials}")
        if credentials.scheme != "Bearer":
            print("Invalid authentication scheme:", credentials.scheme)
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")

        token = credentials.credentials
        print(f"token: {token}")
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        db: Session = SessionLocal()
        try:
            print("Looking for device with token:", token)
            device = db.query(Device).filter(
                Device.device_token == token,
                #Device.device_token_hash == token_hash,
                Device.device_status == "paired",
            ).first()

            if not device:
                raise HTTPException(status_code=401, detail="Invalid or revoked device token")

            return device

        finally:
            db.close()

from decouple import config


JWT_SECRET = config("secret", default="my-default-jwt-secret-key-123")
JWT_ALGORITHM = config("algorithm", default="HS256")

async def EitherBearer(request: Request, db: Session = Depends(get_db)):
    """
    Try JWTBearer first, then DeviceBearer.
    Devices must have device_type = "POS".
    Returns {"type": "user", "data": User} or {"type": "device", "data": Device}
    """
    # JWT first
    try:
        print("Trying JWTBearer")
        token: str = await JWTBearer()(request)
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("user_id")  # adjust depending on your JWT payload
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid JWT payload")
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return {"type": "user", "data": user}

    except HTTPException:
        pass

    # Device
    try:
        print("Trying DeviceBearer")
        device: Device = await DeviceBearer()(request)
        if device.device_type != "POS":
            raise HTTPException(status_code=403, detail="Device type not allowed")
        return {"type": "device", "data": device}
    except HTTPException:
        pass

    raise HTTPException(status_code=401, detail="Not authenticated")
