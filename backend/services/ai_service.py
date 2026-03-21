import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

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
    
    Return ONLY the JSON, no extra text.
    """
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000
    )
    
    import json
    result = response.choices[0].message.content
    return json.loads(result)


def analyze_resume(resume_text: str) -> dict:
    prompt = f"""
    You are an expert resume reviewer and ATS specialist.
    
    Analyze this resume text and respond in this exact JSON format:
    {{
        "overall_score": 75,
        "ats_compatibility": 80,
        "content_quality": 70,
        "formatting": 75,
        "keyword_optimization": 65,
        "impact_score": 72,
        "strengths": [
            {{"title": "strength title", "description": "description"}}
        ],
        "improvements": [
            {{"title": "issue title", "description": "how to fix it", "severity": "high/medium/low"}}
        ],
        "keywords_present": ["keyword1", "keyword2"],
        "keywords_missing": ["keyword1", "keyword2"],
        "keywords_recommended": ["keyword1", "keyword2"],
        "extracted_skills": ["skill1", "skill2"],
        "extracted_name": "full name if found",
        "extracted_email": "email if found",
        "summary": "brief overall feedback"
    }}
    
    Resume text:
    {resume_text[:3000]}
    
    Return ONLY the JSON, no extra text.
    """
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000
    )
    
    import json
    result = response.choices[0].message.content
    return json.loads(result)


def recommend_career_path(user_skills: list, experience_years: int, target_role: str) -> dict:
    prompt = f"""
    You are an expert career advisor.
    
    User profile:
    - Current skills: {', '.join(user_skills)}
    - Years of experience: {experience_years}
    - Target role: {target_role}
    
    Recommend a career path in this exact JSON format:
    {{
        "career_paths": [
            {{
                "role": "job title",
                "level": "Junior/Mid/Senior",
                "timeline": "6 months",
                "requiredSkills": ["skill1", "skill2"],
                "averageSalary": "$80,000 - $100,000",
                "description": "brief role description"
            }}
        ],
        "recommended_path": "name of most recommended path",
        "total_timeline": "X months/years",
        "next_steps": ["step1", "step2", "step3"]
    }}
    
    Return ONLY the JSON, no extra text.
    """
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000
    )
    
    import json
    result = response.choices[0].message.content
    return json.loads(result)


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
    
    Return ONLY the JSON, no extra text.
    """
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1500
    )
    
    import json
    result = response.choices[0].message.content
    parsed = json.loads(result)
    return parsed["matches"]