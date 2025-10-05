import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db import authenticate_user, SessionLocal
from jose import jwt
from datetime import datetime, timedelta

load_dotenv(".env")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev: allow all; use ["http://127.0.0.1:5500"] for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/users/login")
def login(data: dict, db: Session = Depends(get_db)):
    user, error = authenticate_user(db, data["email"], data["password"])
    if error:
        raise HTTPException(status_code=400, detail=error)
    # create JWT token
    payload = {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "exp": datetime.now() + timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES))
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    # Optionally update last_login
    user.last_login = datetime.now()
    db.commit()
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "status": user.status
        }
    }
