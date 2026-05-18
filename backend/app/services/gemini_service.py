import json
import os
from google import genai
from dotenv import load_dotenv

load_dotenv(override=True)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemini-2.5-flash"


def generate_questions(
    subject: str,
    subtopic: str,
    level: float,
    profile: dict,
    recent_wrong: list[dict] = [],
) -> list[dict]:

    strengths = profile.get("strengths", [])
    weaknesses = profile.get("weaknesses", [])
    goals = profile.get("current_goals", [])
    learning_style = profile.get("learning_style", "adaptive")

    # Determine difficulty label and what to focus on
    if level < 3:
        difficulty_guidance = """
LEVEL: Absolute Beginner (score {level}/10)
- Start with "what is" and "why does this exist" questions
- Use real-world analogies before technical definitions
- One concept per question — no compound questions
- Avoid jargon unless explaining it is the point
- Example style: "What problem does X solve, and why was it invented?"
""".format(level=level)
    elif level < 5:
        difficulty_guidance = """
LEVEL: Beginner-Intermediate (score {level}/10)
- Student knows definitions but struggles with application
- Ask "how would you use X in practice"
- Introduce edge cases gently — "what happens when..."
- Connect to real DS workflows (EDA, model training, evaluation)
- Example style: "You have a dataset with 30% missing values. How would you decide whether to drop or impute?"
""".format(level=level)
    elif level < 7:
        difficulty_guidance = """
LEVEL: Intermediate (score {level}/10)
- Student can apply concepts but needs depth
- Ask "why this and not that" — tradeoff reasoning
- Push for intuition behind math, not just formulas
- Include scenario-based questions from real DS work
- Example style: "Your Random Forest model is overfitting. Walk me through 3 strategies to fix this and the tradeoff of each."
""".format(level=level)
    elif level < 9:
        difficulty_guidance = """
LEVEL: Advanced (score {level}/10)
- Student has solid fundamentals — push to expert territory
- Ask about failure modes, edge cases, production concerns
- Questions should require synthesis across multiple concepts
- Include "explain to a non-technical stakeholder" style questions
- Example style: "A client insists on using accuracy as the metric for a fraud detection model with 1% fraud rate. How do you push back and what do you propose instead?"
""".format(level=level)
    else:
        difficulty_guidance = """
LEVEL: Expert (score {level}/10)
- Near-mastery level — challenge with research-level thinking
- Ask about limitations of current approaches
- Questions should require original reasoning, not recall
- Include "design a system" or "critique this approach" style
- Example style: "Design a feature engineering pipeline for a time-series fraud detection problem where you have 50ms latency budget."
""".format(level=level)

    # Build weakness context
    weakness_context = ""
    if weaknesses:
        weakness_context = f"""
KNOWN WEAK AREAS: {', '.join(weaknesses)}
- If {subtopic} overlaps with any weak area above, bias questions toward those gaps
- Don't avoid them — surface them deliberately so the student confronts them
"""

    # Build wrong answer context
    wrong_context = ""
    if recent_wrong:
        wrong_context = f"""
RECENTLY STRUGGLED WITH:
{chr(10).join([f'- Q: {w.get("question", "")} | Missed: {w.get("missing_concepts", [])}' for w in recent_wrong[:3]])}
- Revisit these concepts from a different angle — don't repeat the same question
- Use the missing concepts above as hooks into new questions
"""

    prompt = f"""You are a world-class adaptive learning coach specializing in Data Science education.
Your job is to generate exactly 5 diagnostic questions that reveal exactly what this student
knows and doesn't know about {subject} → {subtopic}.

STUDENT PROFILE:
- Strengths: {strengths if strengths else 'Not specified yet'}
- Weaknesses: {weaknesses if weaknesses else 'Not specified yet'}  
- Learning goals: {goals if goals else 'Not specified yet'}
- Learning style: {learning_style}
- Current mastery level on {subtopic}: {level}/10

{difficulty_guidance}
{weakness_context}
{wrong_context}

QUESTION DESIGN RULES:
1. Every question must have ONE clear correct answer — no open-ended opinion questions
2. Questions must test understanding, not memory — "explain why" beats "define X"
3. Each question targets a DIFFERENT aspect of {subtopic} — no overlap
4. Questions should build in difficulty across the 5 (Q1 easiest, Q5 hardest)
5. Ground questions in realistic Data Science scenarios when possible
6. Avoid trick questions — challenge depth, not gotchas
7. If the student has weaknesses in {weaknesses}, weave those into the questions naturally

EXPECTED CONCEPTS GUIDANCE:
- List 2-4 specific concepts/terms the answer MUST include to be considered correct
- Be precise — "gradient descent" not "optimization"
- These will be used to automatically score the answer

Return ONLY a valid JSON array. No preamble, no explanation, no markdown fences.
[
  {{
    "question": "full question text here",
    "difficulty": "beginner|intermediate|advanced",
    "expected_concepts": ["specific concept 1", "specific concept 2"]
  }}
]"""

    response = client.models.generate_content(model=MODEL, contents=prompt)
    text = response.text.strip()

    # Strip markdown fences if Gemini adds them
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return []


def evaluate_answer(
    question: str,
    expected_concepts: list[str],
    user_answer: str,
    subject: str = "",
    subtopic: str = "",
    difficulty: str = "intermediate",
) -> dict:

    # Calibrate scoring strictness by difficulty
    if difficulty == "beginner":
        scoring_guidance = """
SCORING CALIBRATION (Beginner question):
- Be lenient — reward correct intuition even if phrasing is imprecise
- If the student gets the core idea right but misses terminology: score 0.6-0.75
- Only score below 0.4 if the fundamental concept is wrong or missing entirely
- Encourage partial credit generously at this level
"""
    elif difficulty == "advanced":
        scoring_guidance = """
SCORING CALIBRATION (Advanced question):
- Be strict — partial answers should score 0.4-0.6 at most
- Full credit (0.85+) only if the answer covers tradeoffs, edge cases, AND core concepts
- Penalize vague answers even if directionally correct
- A correct answer that lacks depth scores 0.5-0.65
"""
    else:
        scoring_guidance = """
SCORING CALIBRATION (Intermediate question):
- Balanced scoring — reward correct application even if explanation is incomplete
- Core concept correct + some application = 0.65-0.80
- Core concept correct + full reasoning = 0.80-0.95
- Directionally correct but missing key nuance = 0.45-0.60
"""

    prompt = f"""You are an expert Data Science educator evaluating a student's answer.
Your evaluation must be honest, specific, and actionable — not generic.

CONTEXT:
- Subject: {subject} → {subtopic}  
- Difficulty: {difficulty}

QUESTION: {question}

EXPECTED CONCEPTS (answer must address these to score well):
{chr(10).join([f'- {c}' for c in expected_concepts])}

STUDENT'S ANSWER:
"{user_answer}"

{scoring_guidance}

EVALUATION RULES:
1. raw_score: float 0.0-1.0
   - 0.0-0.3: Fundamentally wrong or completely off-topic
   - 0.3-0.5: Partially correct but missing most key concepts
   - 0.5-0.7: Correct direction, missing important depth or concepts
   - 0.7-0.85: Good answer with minor gaps
   - 0.85-1.0: Excellent — covers concepts, shows understanding, may include nuance

2. is_correct: true if raw_score >= 0.65, false otherwise

3. feedback: MUST be 2-4 sentences. Must include:
   - What the student got RIGHT (be specific, quote their words if useful)
   - What was MISSING or INCORRECT (be direct, not harsh)
   - ONE concrete thing to study or think about next
   - Never write generic feedback like "good job" or "needs improvement"

4. missing_concepts: list only concepts from expected_concepts that were absent
   or insufficiently explained. Empty array if answer was complete.

5. If student wrote nothing, is very short (< 5 words), or is clearly off-topic:
   - raw_score: 0.0
   - feedback: "No meaningful answer provided. Try to write at least a sentence 
     explaining your understanding — even an incomplete answer helps identify gaps."

Return ONLY valid JSON. No preamble, no markdown fences.
{{
  "raw_score": 0.0,
  "is_correct": false,
  "feedback": "specific 2-4 sentence feedback here",
  "missing_concepts": ["concept1", "concept2"]
}}"""

    response = client.models.generate_content(model=MODEL, contents=prompt)
    text = response.text.strip()

    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "raw_score": 0.0,
            "is_correct": False,
            "feedback": "Evaluation failed — please try submitting again.",
            "missing_concepts": [],
        }