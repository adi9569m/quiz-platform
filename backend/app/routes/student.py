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
    try:
        quizzes = Quiz.query.filter_by(status=STATUS_PUBLISHED).order_by(Quiz.id.asc()).all()
        res = []
        for q in quizzes:
            try:
                q_count = len(q.questions) if q.questions else 0
            except Exception:
                q_count = 0
            q_dict = {
                "id": q.id,
                "title": q.title,
                "description": q.description or "",
                "category_id": q.category_id,
                "category": getattr(q, "category_name", "General"),
                "difficulty": getattr(q, "difficulty", "EASY") or "EASY",
                "duration": getattr(q, "duration", 10) or 10,
                "passing_score": getattr(q, "passing_score", 50) or 50,
                "max_attempts": getattr(q, "max_attempts", 3) or 3,
                "status": q.status,
                "question_count": q_count,
                "questions_count": q_count,
            }
            res.append(q_dict)
        return jsonify(res), 200
    except Exception as e:
        import traceback
        print("Error in list_student_quizzes:", traceback.format_exc())
        return jsonify({"message": f"Server error loading quizzes: {str(e)}"}), 500


@student_bp.get("/quizzes/<int:quiz_id>")
@student_required()
def get_student_quiz_detail(quiz_id):
    try:
        quiz = db.session.get(Quiz, quiz_id)
        if not quiz or quiz.status != STATUS_PUBLISHED:
            return jsonify({"message": "Quiz not found"}), 404

        try:
            q_count = len(quiz.questions) if quiz.questions else 0
        except Exception:
            q_count = 0

        q_dict = {
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description or "",
            "category_id": quiz.category_id,
            "category": getattr(quiz, "category_name", "General"),
            "difficulty": getattr(quiz, "difficulty", "EASY") or "EASY",
            "duration": getattr(quiz, "duration", 10) or 10,
            "passing_score": getattr(quiz, "passing_score", 50) or 50,
            "max_attempts": getattr(quiz, "max_attempts", 3) or 3,
            "status": quiz.status,
            "question_count": q_count,
            "questions_count": q_count,
        }

        return jsonify({"quiz": q_dict}), 200
    except Exception as e:
        import traceback
        print("Error in get_student_quiz_detail:", traceback.format_exc())
        return jsonify({"message": f"Server error loading quiz details: {str(e)}"}), 500
