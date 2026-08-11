from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..middleware import admin_required
from ..models import User, ROLE_STUDENT, STATUS_ACTIVE, STATUS_INACTIVE, Quiz, STATUS_DRAFT, STATUS_PUBLISHED

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
    return jsonify({
        "total_students": total_students,
        "total_quizzes": total_quizzes,
        "published_quizzes": published_quizzes,
        "draft_quizzes": draft_quizzes,
        "total_questions": 0,
        "total_attempts": 0,
        "average_score": 0,
        "passed_attempts": 0,
        "failed_attempts": 0
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

