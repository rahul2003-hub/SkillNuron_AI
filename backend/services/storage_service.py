import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
# Storage uploads and signed URLs must use the server-side service-role key.
# The browser-facing SUPABASE_KEY is intentionally not a fallback here.
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
RESUME_BUCKET = os.getenv("SUPABASE_RESUME_BUCKET", "resumes")


async def upload_resume(
    user_id: str,
    filename: str,
    file_bytes: bytes,
    content_type: str = "application/pdf",
) -> str:
    """Upload a resume to Supabase Storage. Returns the object path."""
    if not SUPABASE_SERVICE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_KEY is not configured")
    object_path = f"{user_id}/{filename}"
    url = f"{SUPABASE_URL}/storage/v1/object/{RESUME_BUCKET}/{object_path}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": content_type,
        "x-upsert": "true",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(url, headers=headers, content=file_bytes)

    if response.status_code not in (200, 201):
        raise Exception(f"Resume upload failed: {response.text}")

    return object_path


async def get_resume_signed_url(object_path: str, expires_in: int = 3600) -> str:
    """Generate a temporary signed URL to download a stored resume."""
    if not SUPABASE_SERVICE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_KEY is not configured")
    url = f"{SUPABASE_URL}/storage/v1/object/sign/{RESUME_BUCKET}/{object_path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(url, headers=headers, json={"expiresIn": expires_in})

    if response.status_code != 200:
        raise Exception(f"Could not generate signed URL: {response.text}")

    signed_path = response.json().get("signedURL", "")
    return f"{SUPABASE_URL}/storage/v1{signed_path}"
