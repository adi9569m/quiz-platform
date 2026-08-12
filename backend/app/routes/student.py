from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..middleware import student_required
from ..models import User, Quiz, STATUS_PUBLISHED

student_bp = Blueprint("student", __name__, url_prefix="/api/student")


@student_bp.get("/test")
@student_required()
def student_test():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    return jsonify({
        "message": "Student authorization test successful",
        "user": user.to_dict() if user else None
    }), 200


@student_bp.get("/quizzes")
@student_required()
def list_student_quizzes():
    quizzes = Quiz.query.filter_by(status=STATUS_PUBLISHED).order_by(Quiz.id.asc()).all()
    res = []
    for q in quizzes:
        q_dict = {
            "id": q.id,
            "title": q.title,
            "description": q.description or "",
            "category_id": q.category_id,
            "category": q.category_name,
            "difficulty": q.difficulty,
            "duration": q.duration,
            "passing_score": q.passing_score,
            "max_attempts": q.max_attempts,
            "status": q.status,
            "question_count": len(q.questions),
            "questions_count": len(q.questions),
        }
        res.append(q_dict)
    return jsonify(res), 200


@student_bp.get("/quizzes/<int:quiz_id>")
@student_required()
def get_student_quiz_detail(quiz_id):
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz or quiz.status != STATUS_PUBLISHED:
        return jsonify({"message": "Quiz not found"}), 404

    q_dict = {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description or "",
        "category_id": quiz.category_id,
        "category": quiz.category_name,
        "difficulty": quiz.difficulty,
        "duration": quiz.duration,
        "passing_score": quiz.passing_score,
        "max_attempts": quiz.max_attempts,
        "status": quiz.status,
        "question_count": len(quiz.questions),
        "questions_count": len(quiz.questions),
    }

    return jsonify({"quiz": q_dict}), 200
