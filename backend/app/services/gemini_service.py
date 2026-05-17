import json
import os
from google import genai
from dotenv import load_dotenv

load_dotenv(override=True)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemini-1.5-flash"


def generate_questions(
    subject: str,
    subtopic: str,
    level: float,
    profile: dict,
) -> list[dict]:
    prompt = f"""You are an adaptive learning assistant for a Data Science student.

User Profile:
- Strengths: {profile.get("strengths", [])}
- Weaknesses: {profile.get("weaknesses", [])}
- Goals: {profile.get("current_goals", [])}
- Current level on {subtopic}: {level}/10

Generate 5 questions on the topic: {subject} → {subtopic}

Rules:
- If level < 4: beginner questions — definitions, basic concepts
- If level 4-7: intermediate — application, why/how reasoning
- If level > 7: advanced — edge cases, tradeoffs, real-world application
- Prioritize areas where the user has answered incorrectly recently
- Questions must test intuition, not just definitions
- Return ONLY a JSON array, no extra text:
[
  {{
    "question": "...",
    "difficulty": "beginner|intermediate|advanced",
    "expected_concepts": ["concept1", "concept2"]
  }}
]"""

    response = client.models.generate_content(model=MODEL, contents=prompt)
    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return []


def evaluate_answer(
    question: str,
    expected_concepts: list[str],
    user_answer: str,
) -> dict:
    prompt = f"""You are evaluating a Data Science student's answer.

Question: {question}
Expected concepts to cover: {expected_concepts}
Student's answer: {user_answer}

Evaluate the answer and return ONLY JSON, no extra text:
{{
  "raw_score": 0.0 to 1.0,
  "is_correct": true/false,
  "feedback": "specific feedback on what was right, wrong, or missing",
  "missing_concepts": ["concept1", "concept2"]
}}"""

    response = client.models.generate_content(model=MODEL, contents=prompt)
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "raw_score": 0.0,
            "is_correct": False,
            "feedback": "Failed to evaluate answer. Please try again.",
            "missing_concepts": [],
        }
