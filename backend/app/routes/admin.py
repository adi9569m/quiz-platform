from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..middleware import admin_required
from ..models import User

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
