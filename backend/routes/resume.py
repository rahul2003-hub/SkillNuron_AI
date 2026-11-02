from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel
from services.ai_service import analyze_resume
from services.storage_service import upload_resume, get_resume_signed_url
from models.user import User, ResumeAnalysis
from database import get_db
from sqlalchemy.orm import Session
from deps import get_current_user
import pymupdf as fitz
import uuid as uuid_lib
import hashlib

router = APIRouter(prefix="/api/resume", tags=["Resume"])


def _analysis_source_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _normalise_context(value: str) -> str:
    return " ".join((value or "").split())


def _find_saved_analysis(db: Session, user_id, source_hash: str, target_role: str, job_description: str):
    for saved in db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == user_id).all():
        source = (saved.analysis_json or {}).get("_source", {})
        if (source.get("hash") == source_hash
                and source.get("target_role") == _normalise_context(target_role)
                and source.get("job_description") == _normalise_context(job_description)):
            return saved
    return None


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in pdf_document:
            text += page.get_text()
        pdf_document.close()
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")


@router.post("/analyze")
async def analyze_resume_endpoint(
    file: UploadFile = File(...),
    target_role: str = Form(""),
    job_description: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a PDF or TXT resume and get full AI analysis."""

    filename = file.filename or "resume"
    if not filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and TXT files are supported."
        )

    file_bytes = await file.read()

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )

    source_hash = _analysis_source_hash(file_bytes)
    existing = _find_saved_analysis(db, current_user.id, source_hash, target_role, job_description)
    if existing:
        return {
            "success": True, "filename": existing.filename or filename,
            "analysis": existing.analysis_json, "resume_path": existing.resume_path,
            "source_hash": source_hash, "history_reused": True,
        }

    try:
        resume_text = (
            extract_text_from_pdf(file_bytes)
            if filename.lower().endswith(".pdf")
            else file_bytes.decode("utf-8")
        )
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="TXT files must use UTF-8 encoding.")

    # If PDF text extraction failed, return specific error code
    if not resume_text or len(resume_text) < 30:
        raise HTTPException(
            status_code=422,
            detail="PDF_TEXT_EXTRACTION_FAILED"
        )

    try:
        analysis = await run_in_threadpool(analyze_resume, resume_text, target_role, job_description)
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="AI service is temporarily unavailable"
        )

    resume_path = None
    try:
        stored_filename = f"{uuid_lib.uuid4()}_{filename}"
        resume_path = await upload_resume(str(current_user.id), stored_filename, file_bytes)
    except Exception:
        # Storage failure shouldn't block returning the analysis
        resume_path = None

    return {
        "success": True,
        "filename": filename,
        "analysis": analysis,
        "resume_path": resume_path,
        "source_hash": source_hash,
        "history_reused": False,
    }


class ResumeTextRequest(BaseModel):
    resume_text: str
    target_role: str = ""
    job_description: str = ""


@router.post("/analyze-text")
async def analyze_resume_from_text(
    request: ResumeTextRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze resume from pasted plain text — fallback when PDF fails"""

    if not request.resume_text or len(request.resume_text) < 30:
        raise HTTPException(
            status_code=400,
            detail="Please paste at least some resume content"
        )

    source_hash = _analysis_source_hash(request.resume_text.encode("utf-8"))
    existing = _find_saved_analysis(db, current_user.id, source_hash, request.target_role, request.job_description)
    if existing:
        return {"success": True, "filename": existing.filename or "pasted_text",
                "analysis": existing.analysis_json, "resume_path": existing.resume_path,
                "source_hash": source_hash, "history_reused": True}

    try:
        analysis = await run_in_threadpool(analyze_resume, request.resume_text, request.target_role, request.job_description)
        return {
            "success": True,
            "filename": "pasted_text",
            "analysis": analysis,
            "source_hash": source_hash,
            "history_reused": False,
        }
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="AI service is temporarily unavailable"
        )


@router.get("/download/{resume_path:path}")
async def download_resume(
    resume_path: str,
    current_user: User = Depends(get_current_user)
):
    """Get a temporary signed URL to re-download a stored resume"""
    if not resume_path.startswith(str(current_user.id)):
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        signed_url = await get_resume_signed_url(resume_path)
        return {"success": True, "url": signed_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not generate download link: {str(e)}")
