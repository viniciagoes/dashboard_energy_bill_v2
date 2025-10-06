import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database.db import authenticate_user, SessionLocal, register_user, update_user_status, get_all_clientes
from jose import jwt
from datetime import datetime, timedelta
from gen_ai.gen_ai import extract_data_from_file

# Define constants by loading environment variables
load_dotenv(".env")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")

# Initialize FastAPI app
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

@app.post("/users/register")
def register_user(data: dict, db: Session = Depends(get_db)):
    user, error = register_user(db, data["username"], data["email"], data["password"], data["role"])
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {
        "message": "User registered successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "status": user.status
        }
    }

@app.put("/users/{user_id}/status")
def update_user_status_endpoint(user_id: int, status: str, db: Session = Depends(get_db)):
    user, error = update_user_status(db, user_id, status)
    if error:
        raise HTTPException(status_code=404, detail=error)
    return {
        "message": f"User status updated to {status}",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "status": user.status
        }
    }

@app.get("/clientes")
def get_clientes(db: Session = Depends(get_db)):
    clientes, error = get_all_clientes(db)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"clientes": clientes}

@app.post("/api/bills/extract-pdf")
async def extract_pdf_data(pdf_file: UploadFile = File(...)):
    if pdf_file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        extracted_data = extract_data_from_file(pdf_file.file)  # Pass the starlette UploadFile's file object
        if extracted_data is None:
            raise HTTPException(status_code=422, detail="Extraction returned no valid data")
        return {"success": True, "data": extracted_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))