from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import analyze_psychometric

router = APIRouter(prefix="/api/psychometric", tags=["Psychometric"])

QUESTIONS = [
    {
        "id": "Q1",
        "question": "When starting a new project, what excites you the most?",
        "options": [
            {"id": "A", "text": "Designing the system architecture and APIs"},
            {"id": "B", "text": "Creating beautiful and interactive user interfaces"},
            {"id": "C", "text": "Exploring data to find patterns and insights"},
            {"id": "D", "text": "Building intelligent systems that learn from data"},
            {"id": "E", "text": "Planning features and defining product goals"}
        ]
    },
    {
        "id": "Q2",
        "question": "Which type of problem do you enjoy solving the most?",
        "options": [
            {"id": "A", "text": "Optimizing databases and server performance"},
            {"id": "B", "text": "Making apps look great and easy to use"},
            {"id": "C", "text": "Analyzing trends and building dashboards"},
            {"id": "D", "text": "Training models to make accurate predictions"},
            {"id": "E", "text": "Automating deployments and managing infrastructure"}
        ]
    },
    {
        "id": "Q3",
        "question": "In a team project, what role do you naturally take?",
        "options": [
            {"id": "A", "text": "Backend lead — building APIs and database design"},
            {"id": "B", "text": "Frontend lead — owning the UI and user experience"},
            {"id": "C", "text": "Data lead — handling analysis and reporting"},
            {"id": "D", "text": "AI lead — researching and implementing ML models"},
            {"id": "E", "text": "Product lead — defining requirements and priorities"}
        ]
    },
    {
        "id": "Q4",
        "question": "What type of tools or technologies interest you the most?",
        "options": [
            {"id": "A", "text": "Python, FastAPI, PostgreSQL, Docker"},
            {"id": "B", "text": "React, TypeScript, Figma, CSS animations"},
            {"id": "C", "text": "SQL, Power BI, Excel, Tableau, Pandas"},
            {"id": "D", "text": "TensorFlow, PyTorch, Scikit-learn, Jupyter"},
            {"id": "E", "text": "AWS, Kubernetes, Terraform, CI/CD pipelines"}
        ]
    },
    {
        "id": "Q5",
        "question": "Which activity feels most satisfying to you while working on a project?",
        "options": [
            {"id": "A", "text": "Writing clean, efficient and well-structured code"},
            {"id": "B", "text": "Seeing a pixel-perfect design come to life in the browser"},
            {"id": "C", "text": "Finding a hidden insight in a dataset"},
            {"id": "D", "text": "Watching a model improve its accuracy after training"},
            {"id": "E", "text": "Shipping a feature users love and getting positive feedback"}
        ]
    },
    {
        "id": "Q6",
        "question": "What kind of work environment or tasks do you prefer most?",
        "options": [
            {"id": "A", "text": "Deep focus on solving complex logic problems alone"},
            {"id": "B", "text": "Collaborating with designers to build great experiences"},
            {"id": "C", "text": "Working with business teams to translate data into decisions"},
            {"id": "D", "text": "Researching and experimenting with new AI techniques"},
            {"id": "E", "text": "Coordinating between teams to align on product direction"}
        ]
    },
    {
        "id": "Q7",
        "question": "Which type of project sounds most interesting to you?",
        "options": [
            {"id": "A", "text": "Building a high-performance REST API serving millions of users"},
            {"id": "B", "text": "Designing a mobile app UI that wins a design award"},
            {"id": "C", "text": "Creating a real-time sales analytics dashboard for a company"},
            {"id": "D", "text": "Building a recommendation system like Netflix or Spotify"},
            {"id": "E", "text": "Launching a new product feature from idea to deployment"}
        ]
    },
    {
        "id": "Q8",
        "question": "During a hackathon, what task would you prefer to take responsibility for?",
        "options": [
            {"id": "A", "text": "Setting up the backend server, database and API endpoints"},
            {"id": "B", "text": "Building the frontend UI and making it look impressive"},
            {"id": "C", "text": "Analyzing the dataset and presenting findings to judges"},
            {"id": "D", "text": "Training and integrating the AI model into the product"},
            {"id": "E", "text": "Pitching the idea and managing the team's time and tasks"}
        ]
    },
    {
        "id": "Q9",
        "question": "What motivates you the most in your work?",
        "options": [
            {"id": "A", "text": "Building systems that are reliable, fast and scalable"},
            {"id": "B", "text": "Creating experiences that delight and surprise users"},
            {"id": "C", "text": "Helping businesses make smarter data-driven decisions"},
            {"id": "D", "text": "Pushing the boundaries of what AI can do"},
            {"id": "E", "text": "Solving real user problems and seeing measurable impact"}
        ]
    },
    {
        "id": "Q10",
        "question": "Which type of technical challenge would you choose to solve?",
        "options": [
            {"id": "A", "text": "Reduce API response time from 500ms to 50ms"},
            {"id": "B", "text": "Make the app fully responsive and accessible on all devices"},
            {"id": "C", "text": "Build a pipeline that processes 1 million records per hour"},
            {"id": "D", "text": "Improve a classification model's accuracy from 80% to 95%"},
            {"id": "E", "text": "Identify why user retention dropped 20% last month"}
        ]
    },
    {
        "id": "Q11",
        "question": "What type of learning resources do you enjoy the most?",
        "options": [
            {"id": "A", "text": "System design courses, backend architecture books"},
            {"id": "B", "text": "UI/UX design tutorials, CSS tricks, animation guides"},
            {"id": "C", "text": "Statistics courses, SQL tutorials, BI tool documentation"},
            {"id": "D", "text": "ML research papers, Kaggle competitions, AI courses"},
            {"id": "E", "text": "Product management frameworks, startup case studies"}
        ]
    },
    {
        "id": "Q12",
        "question": "What kind of tools or platforms would you like to master in your career?",
        "options": [
            {"id": "A", "text": "Linux, Docker, Kubernetes, cloud databases"},
            {"id": "B", "text": "Figma, Storybook, Next.js, animation libraries"},
            {"id": "C", "text": "Tableau, Power BI, dbt, Apache Spark"},
            {"id": "D", "text": "Hugging Face, LangChain, MLflow, vector databases"},
            {"id": "E", "text": "Jira, Mixpanel, A/B testing tools, roadmap software"}
        ]
    },
    {
        "id": "Q13",
        "question": "Which activity would you most likely enjoy doing in your free time?",
        "options": [
            {"id": "A", "text": "Building a personal project with a new backend framework"},
            {"id": "B", "text": "Redesigning a popular app's UI just for fun"},
            {"id": "C", "text": "Analyzing a public dataset and publishing your findings"},
            {"id": "D", "text": "Fine-tuning a language model on a custom dataset"},
            {"id": "E", "text": "Brainstorming and sketching ideas for a startup product"}
        ]
    },
    {
        "id": "Q14",
        "question": "What type of problem-solving approach do you prefer?",
        "options": [
            {"id": "A", "text": "Methodical — break into components, test each part"},
            {"id": "B", "text": "Visual — prototype first, iterate based on feedback"},
            {"id": "C", "text": "Analytical — gather data first, then form conclusions"},
            {"id": "D", "text": "Experimental — try multiple approaches, keep the best"},
            {"id": "E", "text": "Strategic — understand the big picture before diving in"}
        ]
    },
    {
        "id": "Q15",
        "question": "When facing a new technical challenge, what would you do first?",
        "options": [
            {"id": "A", "text": "Read documentation, study existing solutions and code"},
            {"id": "B", "text": "Sketch wireframes and think about the user experience"},
            {"id": "C", "text": "Look for relevant datasets or metrics to understand the problem"},
            {"id": "D", "text": "Search for research papers or existing ML models to adapt"},
            {"id": "E", "text": "Talk to stakeholders to understand the business requirement"}
        ]
    }
]

# Career role mapping for AI context
CAREER_ROLES = [
    "Backend Developer", "Frontend Developer", "Full Stack Developer",
    "Data Analyst", "Data Scientist", "AI/ML Engineer",
    "DevOps Engineer", "Cloud Engineer", "Cybersecurity Analyst",
    "UI/UX Designer", "Product Manager", "QA Engineer"
]


class PsychometricRequest(BaseModel):
    answers: dict[str, str]  # {"Q1": "A", "Q2": "C", ...}


@router.get("/questions")
async def get_questions():
    """Return questions with their specific options"""
    return {
        "success": True,
        "total": len(QUESTIONS),
        "questions": QUESTIONS
    }


@router.post("/analyze")
async def analyze_personality(request: PsychometricRequest):
    """Analyze answers and return tech career personality profile"""

    if len(request.answers) < 10:
        raise HTTPException(
            status_code=400,
            detail="Please answer at least 10 questions for an accurate assessment"
        )

    # Build full context — question + chosen option text for AI
    answers_with_context = {}
    for q in QUESTIONS:
        q_id = q["id"]
        if q_id in request.answers:
            chosen_id = request.answers[q_id]
            chosen_option = next(
                (opt["text"] for opt in q["options"] if opt["id"] == chosen_id),
                chosen_id
            )
            answers_with_context[q["question"]] = chosen_option

    try:
        result = analyze_psychometric(answers_with_context, CAREER_ROLES)
        return {
            "success": True,
            "total_questions_answered": len(request.answers),
            "profile": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Psychometric analysis failed: {str(e)}"
        )