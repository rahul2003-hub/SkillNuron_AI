from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from services.ai_service import analyze_resume
import fitz

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
async def analyze_resume_endpoint(file: UploadFile = File(...)):
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


class ResumeTextRequest(BaseModel):
    resume_text: str


@router.post("/analyze-text")
async def analyze_resume_from_text(request: ResumeTextRequest):
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