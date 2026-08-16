from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..middleware import admin_required
from ..models import (
    User,
    ROLE_STUDENT,
    STATUS_ACTIVE,
    STATUS_INACTIVE,
    Quiz,
    STATUS_DRAFT,
    STATUS_PUBLISHED,
    Attempt,
    STATUS_IN_PROGRESS,
    STATUS_PASSED,
    STATUS_FAILED,
    STATUS_EXPIRED,
    Category,
    Question,
    PREDEFINED_CATEGORIES,
)

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.get("/test")
@admin_required()
def admin_test():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    return jsonify({
        "message": "Admin authorization test successful",
        "user": user.to_dict() if user else None
    }), 200


@admin_bp.get("/dashboard/stats")
@admin_required()
def dashboard_stats():
    total_students = User.query.filter_by(role=ROLE_STUDENT).count()
    total_quizzes = Quiz.query.count()
    published_quizzes = Quiz.query.filter_by(status=STATUS_PUBLISHED).count()
    draft_quizzes = Quiz.query.filter_by(status=STATUS_DRAFT).count()
    total_questions = Question.query.count()

    finalized_attempts = Attempt.query.filter(Attempt.status != STATUS_IN_PROGRESS)
    total_attempts = finalized_attempts.count()

    avg_score = db.session.query(db.func.avg(Attempt.percentage)).filter(Attempt.status != STATUS_IN_PROGRESS).scalar()
    average_score = round(float(avg_score), 2) if avg_score is not None else 0.0

    passed_attempts = Attempt.query.filter(Attempt.status == STATUS_PASSED).count()
    failed_attempts = Attempt.query.filter(
        Attempt.status != STATUS_IN_PROGRESS,
        Attempt.status != STATUS_PASSED
    ).count()

    return jsonify({
        "total_students": total_students,
        "total_quizzes": total_quizzes,
        "published_quizzes": published_quizzes,
        "draft_quizzes": draft_quizzes,
        "total_questions": total_questions,
        "total_attempts": total_attempts,
        "average_score": average_score,
        "passed_attempts": passed_attempts,
        "failed_attempts": failed_attempts
    }), 200


@admin_bp.route("/analytics", methods=["GET"])
@admin_bp.route("/analytics/", methods=["GET"])
@admin_required()
def get_analytics():
    # 1. Quiz attempts over time (finalized attempts grouped by date)
    date_col_att = db.func.date(Attempt.completed_at)
    att_results = (
        db.session.query(date_col_att, db.func.count(Attempt.id))
        .filter(Attempt.status != STATUS_IN_PROGRESS, Attempt.completed_at.isnot(None))
        .group_by(date_col_att)
        .order_by(date_col_att.asc())
        .all()
    )
    attempts_over_time = []
    for d, count in att_results:
        d_str = d.strftime("%Y-%m-%d") if hasattr(d, "strftime") else str(d)
        attempts_over_time.append({"date": d_str, "attempts": count})

    # 2. Student registrations over time (STUDENT role grouped by date)
    date_col_user = db.func.date(User.created_at)
    reg_results = (
        db.session.query(date_col_user, db.func.count(User.id))
        .filter(User.role == ROLE_STUDENT, User.created_at.isnot(None))
        .group_by(date_col_user)
        .order_by(date_col_user.asc())
        .all()
    )
    student_registrations = []
    for d, count in reg_results:
        d_str = d.strftime("%Y-%m-%d") if hasattr(d, "strftime") else str(d)
        student_registrations.append({"date": d_str, "registrations": count})

    # 3. Average quiz scores (finalized attempts per quiz)
    score_results = (
        db.session.query(
            Quiz.id,
            Quiz.title,
            db.func.avg(Attempt.percentage)
        )
        .join(Attempt, Attempt.quiz_id == Quiz.id)
        .filter(Attempt.status != STATUS_IN_PROGRESS)
        .group_by(Quiz.id, Quiz.title)
        .order_by(Quiz.id.asc())
        .all()
    )
    average_quiz_scores = []
    for q_id, q_title, avg_score in score_results:
        avg_val = round(float(avg_score), 2) if avg_score is not None else 0.0
        average_quiz_scores.append({
            "quiz_id": q_id,
            "quiz_title": q_title,
            "average_score": avg_val
        })

    # 4. Pass/fail ratio (finalized attempts)
    passed_count = Attempt.query.filter(
        Attempt.status != STATUS_IN_PROGRESS,
        Attempt.status == STATUS_PASSED
    ).count()

    failed_count = Attempt.query.filter(
        Attempt.status != STATUS_IN_PROGRESS,
        Attempt.status != STATUS_PASSED
    ).count()

    pass_fail_ratio = {
        "passed": passed_count,
        "failed": failed_count
    }

    # 5. Most popular quizzes (top 5 by finalized attempts count descending)
    quiz_results = (
        db.session.query(
            Quiz.id,
            Quiz.title,
            db.func.count(Attempt.id).label("attempt_count")
        )
        .join(Attempt, Attempt.quiz_id == Quiz.id)
        .filter(Attempt.status != STATUS_IN_PROGRESS)
        .group_by(Quiz.id, Quiz.title)
        .order_by(db.desc("attempt_count"), Quiz.id.asc())
        .limit(5)
        .all()
    )
    popular_quizzes = []
    for q_id, q_title, count in quiz_results:
        popular_quizzes.append({
            "quiz_id": q_id,
            "quiz_title": q_title,
            "attempt_count": count
        })

    # 6. Most popular categories (top 5 by finalized attempts count descending)
    cat_results = (
        db.session.query(
            Quiz.category_id,
            db.func.count(Attempt.id).label("attempt_count")
        )
        .join(Attempt, Attempt.quiz_id == Quiz.id)
        .filter(Attempt.status != STATUS_IN_PROGRESS)
        .group_by(Quiz.category_id)
        .order_by(db.desc("attempt_count"), Quiz.category_id.asc())
        .limit(5)
        .all()
    )
    popular_categories = []
    for cat_id, count in cat_results:
        cat = db.session.get(Category, cat_id) if cat_id else None
        cat_name = cat.name if cat else PREDEFINED_CATEGORIES.get(cat_id, f"Category {cat_id}")
        popular_categories.append({
            "category_id": cat_id,
            "category": cat_name,
            "attempt_count": count
        })

    return jsonify({
        "attempts_over_time": attempts_over_time,
        "student_registrations": student_registrations,
        "average_quiz_scores": average_quiz_scores,
        "pass_fail_ratio": pass_fail_ratio,
        "popular_quizzes": popular_quizzes,
        "popular_categories": popular_categories
    }), 200


@admin_bp.get("/users")
@admin_required()
def list_users():
    search = request.args.get("search", "").strip()
    query = User.query.filter_by(role=ROLE_STUDENT)
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    users = query.order_by(User.created_at.desc(), User.id.desc()).all()
    return jsonify([user.to_dict() for user in users]), 200


@admin_bp.get("/users/<int:user_id>")
@admin_required()
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user or user.role != ROLE_STUDENT:
        return jsonify({"message": "Student not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


@admin_bp.patch("/users/<int:user_id>/status")
@admin_required()
def update_user_status(user_id):
    data = request.get_json() or {}
    status = data.get("status")
    if status not in [STATUS_ACTIVE, STATUS_INACTIVE]:
        return jsonify({
            "message": "Invalid status value. Must be ACTIVE or INACTIVE"
        }), 400

    user = db.session.get(User, user_id)
    if not user or user.role != ROLE_STUDENT:
        return jsonify({"message": "Student not found"}), 404

    user.status = status
    db.session.commit()
    return jsonify({
        "message": f"User status updated to {status}",
        "user": user.to_dict()
    }), 200


@admin_bp.delete("/users/<int:user_id>")
@admin_required()
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user or user.role != ROLE_STUDENT:
        return jsonify({"message": "Student not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200

