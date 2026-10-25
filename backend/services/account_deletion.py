"""Irreversible account and authentication cleanup helpers."""

import os
import httpx


async def get_supabase_user_id(access_token: str) -> str:
    """Resolve the authenticated Supabase user ID from the current token."""
    url = os.getenv("SUPABASE_URL", "").rstrip("/") + "/auth/v1/user"
    anon_key = os.getenv("SUPABASE_KEY", "")
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers={"Authorization": f"Bearer {access_token}", "apikey": anon_key})
    if response.status_code != 200 or not response.json().get("id"):
        raise RuntimeError("Could not verify the authentication account")
    return response.json()["id"]


async def delete_supabase_auth_user(user_id: str) -> None:
    """Delete a Supabase Auth user through the server-only admin API."""
    base_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not base_url or not service_key:
        raise RuntimeError("SUPABASE_SERVICE_KEY is not configured")
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.delete(
            f"{base_url}/auth/v1/admin/users/{user_id}",
            headers={"Authorization": f"Bearer {service_key}", "apikey": service_key},
        )
    if response.status_code not in (200, 204):
        raise RuntimeError("Could not delete the authentication account")
