from fastapi import FastAPI, Body, Depends

from typing import Annotated
from sqlalchemy.orm import Session

from app.auth.auth_handler import sign_jwt
from app.auth.auth_bearer import JWTBearer
from app.schema import PostSchema, UserLoginSchema, UserSchema

from .routers import users
from .routers import orgnaization
from .routers import devices
from .routers import menu
from .routers import orders
from .routers import displays
from .routers import management

from .database import get_db


app = FastAPI()

db_dependency = Annotated[Session, Depends(get_db)]

app.include_router(users.router)
app.include_router(orgnaization.router)
app.include_router(devices.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(displays.router)
app.include_router(management.router)

def check_user(data: UserLoginSchema):
    for user in users:
        if user.email == data.email and user.password == data.password:
            return True
    return False

@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Welcome to your site!"}

