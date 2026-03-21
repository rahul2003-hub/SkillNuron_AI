from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "skillneuron_secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Temporary in-memory users (we'll add database later)
users_db = []


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

def create_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# --- Endpoints ---

@router.post("/register")
async def register(request: RegisterRequest):
    """Register a new user"""

    # Check if email already exists
    existing = next((u for u in users_db if u["email"] == request.email), None)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    if request.user_type not in ["jobseeker", "recruiter"]:
        raise HTTPException(
            status_code=400,
            detail="user_type must be jobseeker or recruiter"
        )

    new_user = {
        "id": str(len(users_db) + 1),
        "name": request.name,
        "email": request.email,
        "password": request.password,  # plain for now
        "user_type": request.user_type,
        "created_at": datetime.now().strftime("%Y-%m-%d")
    }

    users_db.append(new_user)

    token = create_token({
        "id": new_user["id"],
        "email": new_user["email"],
        "name": new_user["name"],
        "user_type": new_user["user_type"]
    })

    return {
        "success": True,
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": new_user["id"],
            "name": new_user["name"],
            "email": new_user["email"],
            "user_type": new_user["user_type"]
        }
    }


@router.post("/login")
async def login(request: LoginRequest):
    """Login existing user"""

    user = next((
        u for u in users_db
        if u["email"] == request.email
        and u["password"] == request.password
        and u["user_type"] == request.user_type
    ), None)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email, password or user type"
        )

    token = create_token({
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "user_type": user["user_type"]
    })

    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "user_type": user["user_type"]
        }
    }