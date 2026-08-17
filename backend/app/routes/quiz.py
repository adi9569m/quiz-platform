from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..middleware import admin_required, student_required
from ..models.user import User, ROLE_STUDENT, STATUS_ACTIVE
from ..models.quiz import (
    Quiz,
    STATUS_DRAFT,
    STATUS_PUBLISHED,
    VALID_DIFFICULTIES,
    get_category_id_and_name,
)
from ..models.attempt import Attempt, STATUS_IN_PROGRESS, STATUS_EXPIRED

quiz_bp = Blueprint("quiz", __name__, url_prefix="/api/quizzes")



def validate_quiz_data(data, is_update=False):
    errors = []

    if "title" in data or not is_update:
        title = data.get("title")
        if not title or not isinstance(title, str) or not title.strip():
            errors.append("Title is required and must be a non-empty string.")

    category_input = data.get("category_id") if "category_id" in data else data.get("category")
    if category_input is not None or not is_update:
        cat_id, _ = get_category_id_and_name(category_input)
        if cat_id is None:
            errors.append("Category must be one of the five predefined categories: Geography, Indian History, Programming, General Knowledge (GK), Trivia.")

    if "difficulty" in data or not is_update:
        difficulty = data.get("difficulty")
        if not difficulty or not isinstance(difficulty, str) or difficulty.upper() not in VALID_DIFFICULTIES:
            errors.append(f"Difficulty must be one of: {', '.join(VALID_DIFFICULTIES)}.")

    if "duration" in data or not is_update:
        duration = data.get("duration")
        try:
            duration_val = int(duration)
            if duration_val <= 0:
                errors.append("Duration must be a positive integer greater than 0.")
        except (ValueError, TypeError):
            errors.append("Duration must be a valid integer.")

    if "passing_score" in data or not is_update:
        passing_score = data.get("passing_score")
        try:
            score_val = int(passing_score)
            if score_val < 0 or score_val > 100:
                errors.append("Passing score must be an integer between 0 and 100.")
        except (ValueError, TypeError):
            errors.append("Passing score must be a valid integer.")

    if "max_attempts" in data or not is_update:
        max_attempts = data.get("max_attempts")
        try:
            attempts_val = int(max_attempts)
            if attempts_val <= 0:
                errors.append("Max attempts must be a positive integer greater than 0.")
        except (ValueError, TypeError):
            errors.append("Max attempts must be a valid integer.")

    return errors


@quiz_bp.post("")
@admin_required()
def create_quiz():
    data = request.get_json() or {}

    errors = validate_quiz_data(data, is_update=False)
    if errors:
        return jsonify({"message": "Validation failed", "errors": errors}), 400

    cat_id, _ = get_category_id_and_name(data.get("category_id") or data.get("category"))

    new_quiz = Quiz(
        title=data["title"].strip(),
        description=(data.get("description") or "").strip(),
        category_id=cat_id,
        difficulty=data["difficulty"].upper(),
        duration=int(data["duration"]),
        passing_score=int(data["passing_score"]),
        max_attempts=int(data["max_attempts"]),
        status=STATUS_DRAFT,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.session.add(new_quiz)
    db.session.commit()

    return jsonify({"message": "Quiz created successfully", "quiz": new_quiz.to_dict()}), 201


@quiz_bp.get("")
@admin_required()
def list_quizzes():
    quizzes = Quiz.query.order_by(Quiz.created_at.desc(), Quiz.id.desc()).all()
    return jsonify([q.to_dict() for q in quizzes]), 200


@quiz_bp.get("/<int:quiz_id>")
@admin_required()
def get_quiz(quiz_id):
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), 404

    return jsonify({"quiz": quiz.to_dict()}), 200


@quiz_bp.put("/<int:quiz_id>")
@admin_required()
def edit_quiz(quiz_id):
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), 404

    data = request.get_json() or {}
    errors = validate_quiz_data(data, is_update=True)
    if errors:
        return jsonify({"message": "Validation failed", "errors": errors}), 400

    if "title" in data:
        quiz.title = data["title"].strip()
    if "description" in data:
        quiz.description = (data["description"] or "").strip()
    if "category_id" in data or "category" in data:
        cat_id, _ = get_category_id_and_name(data.get("category_id") or data.get("category"))
        if cat_id is not None:
            quiz.category_id = cat_id
    if "difficulty" in data:
        quiz.difficulty = data["difficulty"].upper()
    if "duration" in data:
        quiz.duration = int(data["duration"])
    if "passing_score" in data:
        quiz.passing_score = int(data["passing_score"])
    if "max_attempts" in data:
        quiz.max_attempts = int(data["max_attempts"])

    quiz.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Quiz updated successfully", "quiz": quiz.to_dict()}), 200


@quiz_bp.delete("/<int:quiz_id>")
@admin_required()
def delete_quiz(quiz_id):
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), 404

    db.session.delete(quiz)
    db.session.commit()

    return jsonify({"message": "Quiz deleted successfully"}), 200


@quiz_bp.patch("/<int:quiz_id>/publish")
@admin_required()
def publish_unpublish_quiz(quiz_id):
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), 404

    data = request.get_json(silent=True) or {}
    target_status = data.get("status")

    if target_status:
        if target_status.upper() not in [STATUS_DRAFT, STATUS_PUBLISHED]:
            return jsonify({"message": f"Invalid status. Must be {STATUS_DRAFT} or {STATUS_PUBLISHED}"}), 400
        quiz.status = target_status.upper()
    else:
        quiz.status = STATUS_PUBLISHED if quiz.status == STATUS_DRAFT else STATUS_DRAFT

    quiz.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message": f"Quiz status updated to {quiz.status}",
        "status": quiz.status,
        "quiz": quiz.to_dict()
    }), 200


@quiz_bp.post("/<int:quiz_id>/start")
@student_required()
def start_quiz(quiz_id):
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user or user.status != STATUS_ACTIVE or user.role != ROLE_STUDENT:
        return jsonify({"message": "User not authorized"}), 401

    quiz = db.session.get(Quiz, quiz_id)
    if not quiz or quiz.status != STATUS_PUBLISHED:
        return jsonify({"message": "Quiz not found or not published"}), 404

    existing_attempt = Attempt.query.filter_by(
        user_id=user.id,
        quiz_id=quiz.id,
        status=STATUS_IN_PROGRESS
    ).first()

    if existing_attempt:
        now = datetime.utcnow()
        if now > existing_attempt.expires_at:
            existing_attempt.status = STATUS_EXPIRED
            db.session.commit()
        else:
            return jsonify(existing_attempt.to_dict(include_questions=True)), 200

    started_at = datetime.utcnow()
    expires_at = started_at + timedelta(minutes=quiz.duration)

    attempt = Attempt(
        quiz_id=quiz.id,
        user_id=user.id,
        started_at=started_at,
        expires_at=expires_at,
        status=STATUS_IN_PROGRESS,
    )
    db.session.add(attempt)
    db.session.commit()

    return jsonify(attempt.to_dict(include_questions=True)), 201
