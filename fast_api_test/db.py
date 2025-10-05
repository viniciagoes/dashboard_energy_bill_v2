import os
from passlib.hash import sha256_crypt
from sqlalchemy import create_engine, Column, Integer, String, Date, Float, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Session, declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func
from dotenv import load_dotenv

load_dotenv(".env")

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(256), nullable=False)
    role = Column(String(10), nullable=False)
    status = Column(String(10), default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))

def authenticate_user(session: Session, email: str, password: str):
    user = session.query(User).filter(User.email == email).first()
    if not user:
        return None, "User not found"
    if not sha256_crypt.verify(password, user.password):
        return None, "Incorrect password"
    if user.status == "pending":
        return None, "Your account is pending admin approval"
    if user.status == "rejected":
        return None, "Your account has been rejected. Contact administrator."
    return user, None

if __name__ == "__main__":
    with SessionLocal() as session:
        user, error = authenticate_user(session, "admin@teste.com", "password")
        print(user.username, error)
