from fastapi import APIRouter, Body
from fastapi.params import Depends

from app.auth.auth_bearer import JWTBearer
from app.auth.auth_handler import sign_jwt
from ..schema import UserSchema, UserLoginSchema
from ..database import get_db
from app.models import User
from ..dependencies import get_current_user

from sqlalchemy.orm import Session

import bcrypt

router = APIRouter(prefix="/user", tags=["user"])

@router.post("/signup")
async def create_user(db: Session = Depends(get_db), user: UserSchema = Body(...)):
    new_user = User(
    fullname=user.fullname,
    email=user.email,
    password=bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())#user.password  # hash later
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return sign_jwt(new_user.id)

@router.post("/login")
async def user_login(db: Session = Depends(get_db), user: UserLoginSchema = Body(...)):
    # check user in db
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user and bcrypt.checkpw(user.password.encode('utf-8'), db_user.password):
        return sign_jwt(db_user.id)
    return {
        "error": "Wrong login details!"
    }

@router.get("/me", dependencies=[Depends(JWTBearer())])
async def read_users_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "fullname": current_user.fullname, "email": current_user.email}#.fullname, "email": current_user.email}