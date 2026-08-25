from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from services.ai_service import analyze_resume
from services.storage_service import upload_resume, get_resume_signed_url
from models.user import User
from deps import get_current_user
import pymupdf as fitz
import uuid as uuid_lib

router = APIRouter(prefix="/api/resume", tags=["Resume"])


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
    current_user: User = Depends(get_current_user)
):
    """Upload resume PDF and get full AI analysis"""

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported. Please upload a .pdf file."
        )

    file_bytes = await file.read()

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB."
        )

    resume_text = extract_text_from_pdf(file_bytes)

    # If PDF text extraction failed, return specific error code
    if not resume_text or len(resume_text) < 30:
        raise HTTPException(
            status_code=422,
            detail="PDF_TEXT_EXTRACTION_FAILED"
        )

    try:
        analysis = analyze_resume(resume_text)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}"
        )

    resume_path = None
    try:
        stored_filename = f"{uuid_lib.uuid4()}_{file.filename}"
        resume_path = await upload_resume(str(current_user.id), stored_filename, file_bytes)
    except Exception:
        # Storage failure shouldn't block returning the analysis
        resume_path = None

    return {
        "success": True,
        "filename": file.filename,
        "analysis": analysis,
        "resume_path": resume_path
    }


class ResumeTextRequest(BaseModel):
    resume_text: str


@router.post("/analyze-text")
async def analyze_resume_from_text(
    request: ResumeTextRequest,
    current_user: User = Depends(get_current_user)
):
    """Analyze resume from pasted plain text — fallback when PDF fails"""

    if not request.resume_text or len(request.resume_text) < 30:
        raise HTTPException(
            status_code=400,
            detail="Please paste at least some resume content"
        )

    try:
        analysis = analyze_resume(request.resume_text)
        return {
            "success": True,
            "filename": "pasted_text",
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}"
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