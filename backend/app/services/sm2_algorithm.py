def calculate_new_score(
    current_score: float,
    gemini_raw_score: float,
    attempt_count: int,
    correct_count: int,
    streak: int,
) -> dict:
    accuracy = correct_count / attempt_count if attempt_count > 0 else 0
    streak_factor = min(streak * 0.1, 0.5) if gemini_raw_score > 0.6 else -min(streak * 0.05, 0.3)
    recency_weight = 0.7
    raw_adjusted = gemini_raw_score * 10
    new_score = (recency_weight * raw_adjusted) + ((1 - recency_weight) * current_score)
    accuracy_adjustment = (accuracy - 0.5) * 2
    new_score = new_score + accuracy_adjustment + streak_factor
    new_score = max(1.0, min(10.0, new_score))
    if gemini_raw_score < 0.4:
        next_review_days = 1
    elif gemini_raw_score < 0.7:
        next_review_days = 3
    else:
        next_review_days = max(1, streak * 2)
    return {
        "new_score": round(new_score, 2),
        "next_review_days": next_review_days,
        "updated_streak": streak + 1 if gemini_raw_score > 0.6 else 0,
    }
