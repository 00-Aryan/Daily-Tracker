import json
import asyncio
from datetime import date, datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List
from postgrest.exceptions import APIError
from supabase import Client

from app.schemas.study import (
    ProfileCreate, ProfileResponse,
    QuestionResponse, AttemptCreate, AttemptResponse,
    LevelResponse,
)
from app.services.gemini_service import generate_questions, evaluate_answer
from app.services.sm2_algorithm import calculate_new_score
from app.dependencies import get_current_user, get_db

router = APIRouter()


# --- Profile ---

@router.post("/profile", response_model=ProfileResponse)
async def create_or_update_profile(
    profile: ProfileCreate, 
    current_user: str = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    existing = db.table("user_profile").select("*").eq("user_id", current_user).execute()
    now = datetime.now().isoformat()
    data = {
        "strengths": profile.strengths,
        "weaknesses": profile.weaknesses,
        "learning_style": profile.learning_style,
        "current_goals": profile.current_goals,
        "updated_at": now,
    }
    if existing.data:
        result = db.table("user_profile").update(data).eq("user_id", current_user).execute()
    else:
        data["user_id"] = current_user
        data["created_at"] = now
        result = db.table("user_profile").insert(data).execute()
    row = result.data[0]
    return ProfileResponse(
        id=UUID(row["id"]),
        strengths=row.get("strengths") or [],
        weaknesses=row.get("weaknesses") or [],
        learning_style=row.get("learning_style"),
        current_goals=row.get("current_goals") or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("/profile")
async def get_profile(current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    result = db.table("user_profile").select("*").eq("user_id", current_user).execute()
    if not result.data:
        return None
    row = result.data[0]
    return ProfileResponse(
        id=UUID(row["id"]),
        strengths=row.get("strengths") or [],
        weaknesses=row.get("weaknesses") or [],
        learning_style=row.get("learning_style"),
        current_goals=row.get("current_goals") or [],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


# --- Questions ---

@router.get("/questions/generate", response_model=List[QuestionResponse])
async def generate_study_questions(
    subject_id: UUID = Query(...),
    subtopic_id: UUID = Query(...),
    current_user: str = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    # Get subject and subtopic names
    subject_row = db.table("subjects").select("name").eq("id", str(subject_id)).execute()
    subtopic_row = db.table("subtopics").select("name").eq("id", str(subtopic_id)).execute()
    if not subject_row.data or not subtopic_row.data:
        raise HTTPException(status_code=404, detail="Subject or subtopic not found")

    subject_name = subject_row.data[0]["name"]
    subtopic_name = subtopic_row.data[0]["name"]

    # Get current level
    level_row = db.table("topic_levels").select("*").eq("user_id", current_user).eq("subtopic_id", str(subtopic_id)).execute()
    current_level = level_row.data[0]["numerical_score"] if level_row.data else 1.0

    # Get profile
    profile_row = db.table("user_profile").select("*").eq("user_id", current_user).execute()
    profile = profile_row.data[0] if profile_row.data else {}

    # Generate via Gemini (Offload to thread to prevent blocking event loop)
    try:
        questions = await asyncio.to_thread(
            generate_questions, subject_name, subtopic_name, current_level, profile
        )
    except Exception as e:
        print(f"Gemini generation error: {e}")
        raise HTTPException(status_code=500, detail="AI generation failed")

    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate questions")

    # Save to DB and build response
    saved = []
    now = datetime.now().isoformat()
    for q in questions:
        row_data = {
            "user_id": current_user,
            "subject_id": str(subject_id),
            "subtopic_id": str(subtopic_id),
            "question_text": q["question"],
            "difficulty_level": q.get("difficulty", "intermediate"),
            "expected_concepts": q.get("expected_concepts", []),
            "generated_by": "gemini",
            "created_at": now,
        }
        try:
            res = db.table("study_questions").insert(row_data).execute()
            if not res.data:
                continue
            row = res.data[0]
            saved.append(QuestionResponse(
                id=UUID(row["id"]),
                question_text=row["question_text"],
                difficulty_level=row["difficulty_level"],
                expected_concepts=row.get("expected_concepts") or [],
                subject_id=subject_id,
                subtopic_id=subtopic_id,
            ))
        except APIError as e:
            print(f"Supabase save error: {e}")
            continue

    if not saved:
        raise HTTPException(status_code=500, detail="Failed to save questions")
    return saved


# --- Attempts ---

@router.post("/attempts", response_model=AttemptResponse)
async def submit_attempt(
    attempt: AttemptCreate, 
    current_user: str = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    # Get question
    q_row = db.table("study_questions").select("*").eq("id", str(attempt.question_id)).execute()
    if not q_row.data:
        raise HTTPException(status_code=404, detail="Question not found")
    question = q_row.data[0]

    expected_concepts = question.get("expected_concepts") or []
    if isinstance(expected_concepts, str):
        try:
            expected_concepts = json.loads(expected_concepts)
        except:
            expected_concepts = []

    subject_row = db.table("subjects").select("name")\
        .eq("id", question["subject_id"]).execute()
    subtopic_row = db.table("subtopics").select("name")\
        .eq("id", question["subtopic_id"]).execute()
    subject_name = subject_row.data[0]["name"] if subject_row.data else ""
    subtopic_name = subtopic_row.data[0]["name"] if subtopic_row.data else ""

    # Evaluate via Gemini (Offload to thread to prevent blocking event loop)
    try:
        evaluation = await asyncio.to_thread(
            evaluate_answer,
            question=question["question_text"],
            expected_concepts=expected_concepts,
            user_answer=attempt.user_answer,
            subject=subject_name,
            subtopic=subtopic_name,
            difficulty=question.get("difficulty_level", "intermediate"),
        )
    except Exception as e:
        print(f"Gemini evaluation error: {e}")
        raise HTTPException(status_code=500, detail="AI evaluation failed")

    raw_score = evaluation.get("raw_score", 0.0)
    is_correct = evaluation.get("is_correct", False)
    feedback = evaluation.get("feedback", "No feedback provided.")

    # Get or create topic_level
    subtopic_id = question["subtopic_id"]
    subject_id = question["subject_id"]
    level_row = db.table("topic_levels").select("*").eq("user_id", current_user).eq("subtopic_id", subtopic_id).execute()

    if level_row.data:
        level = level_row.data[0]
    else:
        # Create initial level
        init = {
            "user_id": current_user,
            "subject_id": subject_id,
            "subtopic_id": subtopic_id,
            "numerical_score": 1.0,
            "attempt_count": 0,
            "correct_count": 0,
            "streak": 0,
            "updated_at": datetime.now().isoformat(),
        }
        res = db.table("topic_levels").insert(init).execute()
        level = res.data[0]

    # Calculate new score via SM-2
    new_attempt_count = level["attempt_count"] + 1
    new_correct_count = level["correct_count"] + (1 if is_correct else 0)
    sm2_result = calculate_new_score(
        current_score=level["numerical_score"],
        gemini_raw_score=raw_score,
        attempt_count=new_attempt_count,
        correct_count=new_correct_count,
        streak=level["streak"],
    )

    # Update topic_level
    db.table("topic_levels").update({
        "numerical_score": sm2_result["new_score"],
        "attempt_count": new_attempt_count,
        "correct_count": new_correct_count,
        "streak": sm2_result["updated_streak"],
        "last_attempted": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }).eq("id", level["id"]).execute()

    # Save attempt
    scheduled_for = (date.today() + timedelta(days=sm2_result["next_review_days"])).isoformat()
    db.table("study_attempts").insert({
        "user_id": current_user,
        "question_id": str(attempt.question_id),
        "user_answer": attempt.user_answer,
        "gemini_raw_score": raw_score,
        "final_score": sm2_result["new_score"],
        "feedback": feedback,
        "is_correct": is_correct,
        "scheduled_for": scheduled_for,
        "attempt_date": datetime.now().isoformat(),
    }).execute()

    return AttemptResponse(
        score=raw_score,
        feedback=feedback,
        is_correct=is_correct,
        next_review_days=sm2_result["next_review_days"],
    )


# --- Levels ---

@router.get("/levels", response_model=List[LevelResponse])
async def get_levels(current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    result = db.table("topic_levels").select(
        "*, subjects(name), subtopics(name)"
    ).eq("user_id", current_user).execute()

    return [
        LevelResponse(
            subject_id=UUID(r["subject_id"]),
            subject_name=(r.get("subjects") or {}).get("name"),
            subtopic_id=UUID(r["subtopic_id"]),
            subtopic_name=(r.get("subtopics") or {}).get("name"),
            numerical_score=r["numerical_score"],
            streak=r["streak"],
            attempt_count=r["attempt_count"],
            correct_count=r["correct_count"],
            last_attempted=r.get("last_attempted"),
        )
        for r in result.data
    ]


# --- Stats ---

@router.get("/stats")
async def get_stats(current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    levels = db.table("topic_levels").select(
        "*, subjects(name), subtopics(name)"
    ).eq("user_id", current_user).execute()

    stats = []
    for lvl in levels.data:
        accuracy = (lvl["correct_count"] / lvl["attempt_count"] * 100) if lvl["attempt_count"] > 0 else 0
        stats.append({
            "subject_name": (lvl.get("subjects") or {}).get("name"),
            "subtopic_name": (lvl.get("subtopics") or {}).get("name"),
            "numerical_score": lvl["numerical_score"],
            "accuracy": round(accuracy, 1),
            "attempt_count": lvl["attempt_count"],
            "streak": lvl["streak"],
        })
    return stats


# --- Due Today ---

@router.get("/due-today")
async def get_due_today(current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    today_str = date.today().isoformat()
    result = db.table("study_attempts").select(
        "question_id, scheduled_for, study_questions(question_text, subject_id, subtopic_id, difficulty_level)"
    ).eq("user_id", current_user).lte("scheduled_for", today_str).execute()

    # Deduplicate by question_id (keep latest)
    seen = {}
    for r in result.data:
        qid = r["question_id"]
        seen[qid] = r

    questions = []
    for r in seen.values():
        q = r.get("study_questions") or {}
        questions.append({
            "question_id": r["question_id"],
            "question_text": q.get("question_text"),
            "subject_id": q.get("subject_id"),
            "subtopic_id": q.get("subtopic_id"),
            "difficulty_level": q.get("difficulty_level"),
            "scheduled_for": r["scheduled_for"],
        })
    return questions
