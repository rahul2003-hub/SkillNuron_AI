import os
import uuid
import httpx
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

security = HTTPBearer(auto_error=True)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token"
        )
    
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": SUPABASE_KEY
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{SUPABASE_URL}/auth/v1/user", headers=headers)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auth server connection error: {str(e)}"
        )
        
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )
        
    sb_user = response.json()
    sb_id = sb_user.get("id")
    email = sb_user.get("email")
    user_metadata = sb_user.get("user_metadata", {})
    name = user_metadata.get("name") or (email.split("@")[0] if email else "User")
    user_type = user_metadata.get("user_type", "jobseeker")
    
    if not sb_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user data returned by Supabase Auth"
        )
        
    user_uuid = uuid.UUID(sb_id)
    
    # Query PostgreSQL DB
    user = db.query(User).filter(User.id == user_uuid).first()
    if user:
        # Sync user_type or name if updated in Supabase auth metadata
        if (user_type and user.user_type != user_type) or (name and user.name != name):
            if user_type:
                user.user_type = user_type
            if name:
                user.name = name
            db.commit()
            db.refresh(user)
    else:
        # Check by email in case of legacy account match
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.name = name
            user.user_type = user_type
            db.commit()
            db.refresh(user)
        else:
            user = User(
                id=user_uuid,
                name=name,
                email=email,
                password_hash="supabase_auth",
                user_type=user_type
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
    return user


def require_recruiter(user: User = Depends(get_current_user)) -> User:
    if user.user_type != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to recruiters"
        )
    return user


def require_jobseeker(user: User = Depends(get_current_user)) -> User:
    if user.user_type != "jobseeker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to jobseekers"
        )
    return user
