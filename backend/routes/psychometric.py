from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import analyze_psychometric

router = APIRouter(prefix="/api/psychometric", tags=["Psychometric"])

# 20 New Questions based on the Tech Niche & Behavioral Assessment (TNBA)
QUESTIONS = [
    {
        "id": "q1",
        "question": "You are tasked with building a new internal tool for 500 employees. Where do you start?",
        "options": [
            {"id": "A", "text": "Drawing a high-level diagram of how data flows between different services and databases."},
            {"id": "B", "text": "Identifying the exact UI components and user journeys to ensure the staff finds it intuitive."},
            {"id": "C", "text": "Researching the most efficient database schema to handle potential scaling to 50,000 users 'just in case.'"},
            {"id": "D", "text": "Writing a prototype script immediately to see if the core functionality is even feasible."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q2",
        "question": "A legacy system is slowing down the team. It’s 'spaghetti code,' but it works. What is your instinct?",
        "options": [
            {"id": "A", "text": "Map out the dependencies to slowly migrate the system to a microservices architecture."},
            {"id": "B", "text": "Leave it alone; if it’s providing value to the users, my time is better spent on new features."},
            {"id": "C", "text": "Deep-dive into the most 'expensive' functions to optimize their execution time and memory usage."},
            {"id": "D", "text": "Propose a 'greenfield' rewrite using a modern, more maintainable framework."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q3",
        "question": "You are choosing a database for a new project. What is your primary criteria?",
        "options": [
            {"id": "A", "text": "How well it integrates with the existing ecosystem and its long-term maintenance overhead."},
            {"id": "B", "text": "How quickly the team can build on top of it to ship the MVP."},
            {"id": "C", "text": "Its consistency guarantees (ACID compliance) and performance under heavy mathematical loads."},
            {"id": "D", "text": "Whether it supports the specific data structures (like graphs or documents) required by the unique problem."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q4",
        "question": "You are assigned to a project involving massive amounts of data. What excites you?",
        "options": [
            {"id": "A", "text": "Figuring out the 'plumbing'—how to move data from Point A to Point B without loss."},
            {"id": "B", "text": "What the data says—building the dashboards that tell the story of user behavior."},
            {"id": "C", "text": "The model—fine-tuning the logic or algorithms that predict the next data point."},
            {"id": "D", "text": "The security—ensuring that every byte is encrypted and access-controlled."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q5",
        "question": "When someone says 'Scalability,' what do you think of?",
        "options": [
            {"id": "A", "text": "Load balancers, horizontal scaling, and decoupling services."},
            {"id": "B", "text": "Making sure the interface doesn't get cluttered as more features are added."},
            {"id": "C", "text": "Optimizing the algorithmic complexity from O(n^2) to O(n log n)."},
            {"id": "D", "text": "Automating the deployment pipeline so scaling happens without human intervention."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q6",
        "question": "Production is down. The 'PagerDuty' alarm is screaming at 2:00 AM. What is your first move?",
        "options": [
            {"id": "A", "text": "Check the system health dashboard to identify which service's latency spiked first."},
            {"id": "B", "text": "Communicate with the stakeholders immediately to manage expectations and provide an ETA."},
            {"id": "C", "text": "Dive into the recent logs to find the specific stack trace or null pointer that caused the crash."},
            {"id": "D", "text": "Revert the most recent deployment instantly; we’ll figure out why it broke tomorrow."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q7",
        "question": "You encounter a 'Heisenbug'—a bug that disappears when you try to study it. How do you feel?",
        "options": [
            {"id": "A", "text": "Methodical. I will add instrumentation to every layer until it has nowhere to hide."},
            {"id": "B", "text": "Frustrated. This is preventing me from delivering the actual features people need."},
            {"id": "C", "text": "Intrigued. This is a challenge to my understanding of how the compiler or OS works."},
            {"id": "D", "text": "Determined. I’ll scour the version control history to see exactly when this ghost entered the machine."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q8",
        "question": "A security vulnerability is discovered in a third-party library you use. What is your priority?",
        "options": [
            {"id": "A", "text": "Assessing the 'blast radius' to see which other systems are connected to the vulnerable one."},
            {"id": "B", "text": "Finding a workaround that doesn't break the current UI/UX or user workflow."},
            {"id": "C", "text": "Reading the CVE report in detail to understand the low-level exploit mechanism."},
            {"id": "D", "text": "Automating a script to patch every instance of this library across the entire organization."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q9",
        "question": "You realize a core assumption in your code is wrong, and you’re halfway through the sprint. Do you:",
        "options": [
            {"id": "A", "text": "Stop and redesign the module; a bad foundation will collapse eventually."},
            {"id": "B", "text": "Find a 'hack' to make it work for now, then document it as technical debt."},
            {"id": "C", "text": "Spend the weekend refactoring the logic to be mathematically sound."},
            {"id": "D", "text": "Ask for a team meeting to re-align the project goals based on this new information."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q10",
        "question": "When debugging, you prefer tools that:",
        "options": [
            {"id": "A", "text": "Show you the 'big picture' (distributed tracing, network maps)."},
            {"id": "B", "text": "Help you see what the user sees (browser dev tools, heatmaps)."},
            {"id": "C", "text": "Allow you to inspect memory, registers, and individual variables (GDB, LLDB)."},
            {"id": "D", "text": "Automate the testing process to find the failure point (Unit tests, Fuzzing)."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q11",
        "question": "You have a free week for a 'hackathon.' What are you building?",
        "options": [
            {"id": "A", "text": "A tool that automates the boring parts of the team's setup/deployment."},
            {"id": "B", "text": "A sleek new mobile app that solves a common daily annoyance."},
            {"id": "C", "text": "A more efficient implementation of a common library or algorithm."},
            {"id": "D", "text": "A experimental 'proof of concept' using a brand new, unproven language or framework."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q12",
        "question": "You see a piece of code that is slightly inefficient but very easy to read. What do you do?",
        "options": [
            {"id": "A", "text": "Leave it; readability is a form of system stability."},
            {"id": "B", "text": "Leave it; users won't notice a 10ms difference."},
            {"id": "C", "text": "Refactor it; inefficient code is an insult to the hardware."},
            {"id": "D", "text": "Wrap it in a better abstraction so the inefficiency is hidden but the API is clean."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q13",
        "question": "A new 'Shiny' framework is trending on GitHub. Your reaction is:",
        "options": [
            {"id": "A", "text": "'Will this make our infrastructure easier to manage in three years?'"},
            {"id": "B", "text": "'Can I use this to make the frontend feel more snappy?'"},
            {"id": "C", "text": "'Does it offer better performance or memory safety than what we have?'"},
            {"id": "D", "text": "'I need to try this tonight to see if it changes how we think about problems.'"},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q14",
        "question": "You are asked to work on a project using an 'old' language like COBOL or C. You think:",
        "options": [
            {"id": "A", "text": "'This is a great chance to understand the core systems that run the world.'"},
            {"id": "B", "text": "'I’m worried this will make my skills irrelevant for modern product roles.'"},
            {"id": "C", "text": "'I can probably find ways to optimize this to run faster than anyone thought possible.'"},
            {"id": "D", "text": "'I wonder if I can build a bridge to make this work with modern DevOps tools.'"},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q15",
        "question": "Success for you is:",
        "options": [
            {"id": "A", "text": "A system that runs for a year with 99.99% uptime and zero manual intervention."},
            {"id": "B", "text": "A product that receives rave reviews from users for its 'feel' and usability."},
            {"id": "C", "text": "Solving a problem that was previously thought to be computationally impossible."},
            {"id": "D", "text": "Being the first person to implement a cutting-edge feature in your industry."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q16",
        "question": "In a Daily Stand-up, your updates usually sound like:",
        "options": [
            {"id": "A", "text": "'I've cleared the bottleneck in the pipeline; the data flow is now consistent.'"},
            {"id": "B", "text": "'I've finished the user profile screen and started on the checkout flow.'"},
            {"id": "C", "text": "'I'm still deep in the logic for the recommendation engine; it’s a complex one.'"},
            {"id": "D", "text": "'I’ve updated the documentation and the CI/CD scripts for the new release.'"},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q17",
        "question": "You are writing documentation. What do you focus on?",
        "options": [
            {"id": "A", "text": "The system architecture and how different components interact."},
            {"id": "B", "text": "The 'How-To' guide for users or other developers to use the feature."},
            {"id": "C", "text": "The mathematical or logical proofs behind why the solution works."},
            {"id": "D", "text": "The setup guide, including environment variables and deployment steps."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q18",
        "question": "Your ideal 'Deep Work' environment is:",
        "options": [
            {"id": "A", "text": "Surrounded by monitors showing real-time system metrics and logs."},
            {"id": "B", "text": "A coffee shop where I can see people using technology in the real world."},
            {"id": "C", "text": "A silent room with a whiteboard and no distractions."},
            {"id": "D", "text": "A collaborative space where I can bounce ideas off others frequently."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q19",
        "question": "A Product Manager asks for a feature that is technically 'messy' but high-value. You:",
        "options": [
            {"id": "A", "text": "Explain the long-term technical debt it will create and suggest a structural compromise."},
            {"id": "B", "text": "Get excited! If it helps the user, let’s find a way to make it happen."},
            {"id": "C", "text": "Try to find a way to implement it that doesn't compromise the elegance of the codebase."},
            {"id": "D", "text": "Ask why we are doing this and if there’s a more 'automated' way to achieve the goal."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    },
    {
        "id": "q20",
        "question": "You’ve been offered a promotion. Which path do you take?",
        "options": [
            {"id": "A", "text": "Principal Architect: Designing the roadmap for the entire company's tech stack."},
            {"id": "B", "text": "Product Lead: Having more say in what we build and why it matters to people."},
            {"id": "C", "text": "Distinguished Engineer: Staying in the code, solving the hardest technical puzzles."},
            {"id": "D", "text": "Engineering Manager: Focusing on the people, the processes, and the team culture."},
            {"id": "E", "text": "Other (Please specify)"}
        ]
    }
]

# Expanded Career role mapping for better AI context matching
CAREER_ROLES = [
    "Full Stack Developer", "Frontend Developer", "Backend Developer", 
    "Python Developer", "Java Developer", "Mobile App Developer",
    "Data Scientist", "Machine Learning Engineer", "Data Engineer", "Data Analyst", 
    "DevOps Engineer", "Cloud Architect", "Site Reliability Engineer (SRE)", 
    "Cybersecurity Analyst", "Database Administrator (DBA)",
    "UI/UX Designer", "Product Manager", "Systems Architect", "QA Automation Engineer"
]

class PsychometricRequest(BaseModel):
    answers: dict[str, str]  # {"q1": "A", "q2": "E: Custom text", ...}

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

    # Ensure they answered enough questions
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
            
            # This is your robust old logic! If it's a custom string like "E: my answer",
            # it falls back to passing "E: my answer" directly to the AI.
            chosen_option = next(
                (opt["text"] for opt in q["options"] if opt["id"] == chosen_id),
                chosen_id
            )
            answers_with_context[q["question"]] = chosen_option

    try:
        # Pass BOTH required arguments exactly as your original code did
        result = analyze_psychometric(answers_with_context, CAREER_ROLES)
        
        # Note: Added both 'profile' and 'analysis' to support varying frontend states
        return {
            "success": True,
            "total_questions_answered": len(request.answers),
            "profile": result,
            "analysis": result 
        }
    except Exception as e:
        print(f"Error during analysis: {str(e)}") # Help debug any future issues
        raise HTTPException(
            status_code=500,
            detail=f"Psychometric analysis failed: {str(e)}"
        )