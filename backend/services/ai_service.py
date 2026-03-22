import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"


def clean_json_response(text: str) -> dict:
    """Remove markdown code blocks and parse JSON safely"""
    # Remove ```json ... ``` or ``` ... ``` wrappers
    text = text.strip()
    text = re.sub(r'^```json\s*', '', text)
    text = re.sub(r'^```\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    text = text.strip()

    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find JSON object using regex - extract everything between first { and last }
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Last resort - raise clear error
    raise ValueError(f"Could not parse AI response as JSON. Raw response: {text[:200]}")



def analyze_skill_gap(user_skills: list, target_role: str) -> dict:
    prompt = f"""
    You are an expert career coach and skill gap analyzer.
    
    The user has these skills: {', '.join(user_skills)}
    Their target role is: {target_role}
    
    Analyze the skill gap and respond in this exact JSON format:
    {{
        "missing_skills": [
            {{
                "skill": "skill name",
                "priority": "high/medium/low",
                "currentLevel": 0,
                "targetLevel": 80,
                "recommendation": "how to learn this skill"
            }}
        ],
        "learning_resources": [
            {{
                "title": "course name",
                "platform": "platform name",
                "duration": "X hours",
                "skill": "related skill"
            }}
        ],
        "action_plan": ["step 1", "step 2", "step 3"],
        "summary": "brief summary of the gap analysis"
    }}
    
    Return ONLY the JSON object. No markdown, no code blocks, no extra text.
    """

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000
    )

    result = response.choices[0].message.content
    return clean_json_response(result)


def analyze_resume(resume_text: str) -> dict:
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) specialist and resume reviewer.
    
    Analyze the resume text using these SPECIFIC ATS scoring criteria:
    
    ATS SCORING RULES (be strict and realistic):
    
    1. ats_compatibility (0-100): Check for:
       - Standard section headings (Experience, Education, Skills, Summary)
       - No tables, columns, images or special characters
       - Standard fonts and clean formatting
       - Contact info present (name, email, phone)
       - File is text-readable (not scanned)
       Deduct points for each missing item.
    
    2. keyword_optimization (0-100): Check for:
       - Industry-specific technical keywords present
       - Action verbs (developed, led, built, managed, designed)
       - Measurable achievements with numbers
       - Job title keywords matching common roles
       Deduct 10 points for each missing category.
    
    3. content_quality (0-100): Check for:
       - Professional summary or objective
       - Work experience with dates and company names
       - Quantified achievements (%, numbers, INR amounts)
       - Education section complete
       Deduct points for vague or missing content.
    
    4. formatting (0-100): Check for:
       - Consistent date formats
       - Proper use of bullet points
       - Logical reverse-chronological order
       - No spelling/grammar errors visible
       - Appropriate length (1-2 pages worth of content)
    
    5. impact_score (0-100): Check for:
       - Strong action verbs at start of bullets
       - Quantified results (increased sales by 30%)
       - Leadership or ownership language
       - Unique value proposition visible
    
    6. overall_score: Weighted average:
       ats_compatibility x 0.25 + keyword_optimization x 0.25 + 
       content_quality x 0.20 + formatting x 0.15 + impact_score x 0.15
       Round to nearest integer.
    
    Return ONLY this JSON structure, no markdown, no code blocks:
    {{
        "overall_score": 72,
        "ats_compatibility": 80,
        "content_quality": 70,
        "formatting": 75,
        "keyword_optimization": 65,
        "impact_score": 68,
        "strengths": [
            {{"title": "strength title", "description": "specific observation from resume"}}
        ],
        "improvements": [
            {{"title": "issue title", "description": "specific actionable fix", "severity": "high/medium/low"}}
        ],
        "keywords_present": ["actual keywords found in resume"],
        "keywords_missing": ["important missing keywords for this role"],
        "keywords_recommended": ["suggested keywords to add"],
        "extracted_skills": ["skills found in resume"],
        "extracted_name": "name from resume",
        "extracted_email": "email from resume",
        "summary": "2 sentence honest overall feedback"
    }}
    
    Resume text to analyze:
    {resume_text[:2500]}
    """

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000
    )

    result = response.choices[0].message.content
    return clean_json_response(result)


def recommend_career_path(user_skills: list, experience_years: int, target_role: str) -> dict:
    prompt = f"""
    You are an expert career advisor.
    
    You are an expert career advisor specializing in the Indian job market.
    
    User profile:
    - Current skills: {', '.join(user_skills)}
    - Years of experience: {experience_years}
    - Target role: {target_role}
    - Location preference: Indian cities (Mumbai, Pune, Navi Mumbai, Bangalore, Hyderabad, Noida, Chennai, Delhi)
    
    Important rules:
    - All salaries MUST be in Indian Rupees (INR) per annum e.g. "₹6,00,000 - ₹10,00,000 per annum"
    - Mention which Indian cities have the most demand for each role
    - Use Indian job market standards for experience levels
    - Reference Indian companies and platforms where relevant (TCS, Infosys, Wipro, Flipkart, Swiggy, Zomato, startups etc.)
    
    Recommend a career path in this exact JSON format:
    {{
        "career_paths": [
            {{
                "role": "job title",
                "level": "Junior/Mid/Senior",
                "timeline": "6 months",
                "requiredSkills": ["skill1", "skill2"],
                "averageSalary": "₹8,00,000 - ₹12,00,000 per annum",
                "description": "brief role description"
            }}
        ],
        "recommended_path": "name of most recommended path",
        "total_timeline": "X months/years",
        "next_steps": ["step1", "step2", "step3"]
    }}
    
    Return ONLY the JSON object. No markdown, no code blocks, no extra text.
    """

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000
    )

    result = response.choices[0].message.content
    return clean_json_response(result)


def match_jobs_to_candidate(user_skills: list, job_listings: list) -> list:
    prompt = f"""
    You are an expert job matching AI.
    
    Candidate skills: {', '.join(user_skills)}
    
    Job listings: {str(job_listings[:5])}
    
    For each job, calculate a match score and respond in this exact JSON format:
    {{
        "matches": [
            {{
                "job_id": "job id",
                "match_score": 85,
                "matching_skills": ["skill1", "skill2"],
                "missing_skills": ["skill1"],
                "recommendation": "why this job fits"
            }}
        ]
    }}
    
    Return ONLY the JSON object. No markdown, no code blocks, no extra text.
    """

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1500
    )

    result = response.choices[0].message.content
    parsed = clean_json_response(result)
    return parsed["matches"]

def analyze_psychometric(answers: dict, career_roles: list) -> dict:
    """
    Takes user answers to tech career questions
    and returns career personality profile + role recommendations
    """

    formatted_answers = "\n".join([
        f"Q: {q}\nA: {a}" for q, a in answers.items()
    ])

    roles_list = ", ".join(career_roles)

    prompt = f"""
    You are an expert tech career psychologist specializing in the Indian IT industry.
    
    A user has answered these tech career interest questions:
    
    {formatted_answers}
    
    Available career roles to map to: {roles_list}
    
    Analyze their answers and respond in this exact JSON format:
    {{
        "personality_type": "The Architect / The Creator / The Analyst / The Innovator / The Strategist",
        "personality_description": "2-3 sentence description of this tech personality",
        "top_strengths": ["strength1", "strength2", "strength3"],
        "work_style": "how this person works best in a tech environment",
        "ideal_environment": "what kind of tech company or team suits them",
        "career_matches": [
            {{
                "role": "exact role from the provided list",
                "fit_score": 92,
                "reason": "why this role suits their answers",
                "indian_companies": ["Flipkart", "Razorpay", "CRED"]
            }}
        ],
        "career_avoid": ["Role - reason why"],
        "learning_style": "how they learn best technically",
        "recommended_first_step": "one concrete action they should take this week",
        "summary": "one paragraph overall tech career assessment"
    }}
    
    Rules:
    - career_matches must have 3 roles ordered by fit_score descending
    - fit_score must be between 60 and 99
    - indian_companies must be real Indian tech companies relevant to that role
    - career_avoid must have 2 roles with reasons
    - Return ONLY the JSON object. No markdown, no code blocks, no extra text.
    """

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=2000
    )

    result = response.choices[0].message.content
    return clean_json_response(result)