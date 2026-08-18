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
        return jsonify({"message": f"Server error loading quiz details: {str(e)}"}), 500


@student_bp.get("/dashboard")
@student_required()
def get_student_dashboard():
    try:
        from datetime import datetime
        from ..models import (
            Attempt,
            STATUS_IN_PROGRESS,
            STATUS_PASSED,
            STATUS_FAILED,
            STATUS_EXPIRED,
        )
        from .attempt import finalize_and_score_attempt

        user_id = int(get_jwt_identity())
        now = datetime.utcnow()

        expired_in_progress = Attempt.query.filter(
            Attempt.user_id == user_id,
            Attempt.status == STATUS_IN_PROGRESS,
            Attempt.expires_at < now,
        ).all()

        for att in expired_in_progress:
            finalize_and_score_attempt(att, is_expired=True)

        finalized_attempts = Attempt.query.filter(
            Attempt.user_id == user_id,
            Attempt.status != STATUS_IN_PROGRESS,
        ).all()

        total_attempted = len(finalized_attempts)
        total_passed = sum(1 for a in finalized_attempts if a.status == STATUS_PASSED)
        total_failed = sum(1 for a in finalized_attempts if a.status in (STATUS_FAILED, STATUS_EXPIRED))

        if total_attempted > 0:
            percentages = [a.percentage for a in finalized_attempts if a.percentage is not None]
            average_score = round(sum(percentages) / float(len(percentages)), 2) if percentages else 0.0
            highest_score = round(max(percentages), 2) if percentages else 0.0
            total_questions_answered = sum(
                (a.correct_answers or 0) + (a.incorrect_answers or 0) for a in finalized_attempts
            )
        else:
            average_score = 0.0
            highest_score = 0.0
            total_questions_answered = 0

        statistics = {
            "total_attempted": total_attempted,
            "total_passed": total_passed,
            "total_failed": total_failed,
            "average_score": average_score,
            "highest_score": highest_score,
            "total_questions_answered": total_questions_answered,
        }

        def _to_utc_iso(dt):
            if not dt:
                return None
            s = dt.isoformat()
            return s + "Z" if not s.endswith("Z") else s

        recent_query = Attempt.query.filter(
            Attempt.user_id == user_id,
            Attempt.status != STATUS_IN_PROGRESS,
        ).order_by(Attempt.completed_at.desc(), Attempt.id.desc()).limit(5).all()

        recent_attempts = []
        for att in recent_query:
            recent_attempts.append({
                "attempt_id": att.id,
                "quiz_id": att.quiz_id,
                "quiz_title": att.quiz.title if att.quiz else "",
                "category": att.quiz.category_name if att.quiz else "",
                "percentage": att.percentage,
                "status": att.status,
                "completed_at": _to_utc_iso(att.completed_at),
            })

        perf_query = Attempt.query.filter(
            Attempt.user_id == user_id,
            Attempt.status != STATUS_IN_PROGRESS,
        ).order_by(Attempt.completed_at.asc(), Attempt.id.asc()).all()

        if len(perf_query) > 10:
            perf_query = perf_query[-10:]

        performance = []
        for att in perf_query:
            performance.append({
                "quiz_title": att.quiz.title if att.quiz else "",
                "percentage": att.percentage,
                "completed_at": _to_utc_iso(att.completed_at),
            })

        return jsonify({
            "statistics": statistics,
            "recent_attempts": recent_attempts,
            "performance": performance,
        }), 200
    except Exception as e:
        return jsonify({"message": f"Server error loading dashboard: {str(e)}"}), 500
