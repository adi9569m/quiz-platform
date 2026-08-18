from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from .extensions import db
from .models import User, ROLE_ADMIN, ROLE_STUDENT, STATUS_ACTIVE


def role_required(required_role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()

            try:
                user_id_int = int(user_id)
            except (ValueError, TypeError):
                return jsonify({"message": "Invalid token identity"}), 401

            user = db.session.get(User, user_id_int)
            if not user or user.status != STATUS_ACTIVE:
                return jsonify({"message": "User not found or inactive"}), 401

            if user.role != required_role:
                return jsonify({"message": "Access forbidden: insufficient permissions"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required():
    return role_required(ROLE_ADMIN)


def student_required():
    return role_required(ROLE_STUDENT)
