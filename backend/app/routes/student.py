from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..middleware import student_required
from ..models import User

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
