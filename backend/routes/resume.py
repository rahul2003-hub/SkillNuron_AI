from fastapi import APIRouter, UploadFile, File, HTTPException
from services.ai_service import analyze_resume
import fitz  # PyMuPDF
import io

router = APIRouter(prefix="/api/resume", tags=["Resume"])


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF"""
    try:
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in pdf_document:
            text += page.get_text()
        pdf_document.close()
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Upload a resume PDF and extract text"""

    # Check file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    # Check file size (max 10MB)
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB"
        )

    # Extract text from PDF
    resume_text = extract_text_from_pdf(file_bytes)

    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from PDF. Make sure it is not a scanned image."
        )

    return {
        "success": True,
        "filename": file.filename,
        "text_length": len(resume_text),
        "resume_text": resume_text
    }


@router.post("/analyze")
async def analyze_resume_endpoint(file: UploadFile = File(...)):
    """Upload resume and get full AI analysis"""

    # Check file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    file_bytes = await file.read()

    # Extract text
    resume_text = extract_text_from_pdf(file_bytes)

    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from PDF"
        )

    # Send to AI for analysis
    try:
        analysis = analyze_resume(resume_text)
        return {
            "success": True,
            "filename": file.filename,
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}"
        )