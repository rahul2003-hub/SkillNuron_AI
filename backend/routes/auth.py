from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from database import get_db
from models.user import User
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "skillneuron_secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Request Models ---
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    user_type: str  # "jobseeker" or "recruiter"

class LoginRequest(BaseModel):
    email: str
    password: str
    user_type: str

# --- Helper Functions ---
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# --- Endpoints ---
@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user — saves to PostgreSQL"""
    
    if request.user_type not in ["jobseeker", "recruiter"]:
        raise HTTPException(
            status_code=400,
            detail="user_type must be jobseeker or recruiter"
        )

    # Check if email already exists in DB
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
        user_type=request.user_type
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_token({
        "id": str(new_user.id),
        "email": new_user.email,
        "name": new_user.name,
        "user_type": new_user.user_type
    })

    return {
        "success": True,
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": str(new_user.id),
            "name": new_user.name,
            "email": new_user.email,
            "user_type": new_user.user_type
        }
    }

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login — checks real PostgreSQL database"""

    # Find user by email and user_type
    user = db.query(User).filter(
        User.email == request.email,
        User.user_type == request.user_type
    ).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email, password or user type"
        )

    token = create_token({
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "user_type": user.user_type
    })

    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "user_type": user.user_type
        }
    }

@router.get("/users")
async def get_all_users(db: Session = Depends(get_db)):
    """Dev helper — see all registered users"""
    users = db.query(User).all()
    return {
        "total": len(users),
        "users": [
            {
                "id": str(u.id),
                "name": u.name,
                "email": u.email,
                "user_type": u.user_type,
                "created_at": str(u.created_at)
            }
            for u in users
        ]
    }