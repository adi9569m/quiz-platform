from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from .extensions import db
from .models import User, ROLE_ADMIN, ROLE_STUDENT, STATUS_ACTIVE


def role_required(required_role):
    """
    Reusable decorator for role-based endpoint authorization.
    Verifies JWT token, loads DB user, checks user status and role.
    Returns HTTP 401 for missing/invalid token or user, HTTP 403 for wrong role.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # verify_jwt_in_request raises JWTExtendedException on missing/invalid token,
            # which Flask-JWT-Extended converts to HTTP 401 response.
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
    """Authorization decorator for Admin-only routes."""
    return role_required(ROLE_ADMIN)


def student_required():
    """Authorization decorator for Student-only routes."""
    return role_required(ROLE_STUDENT)
