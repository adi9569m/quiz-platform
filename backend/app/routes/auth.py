import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError

from ..extensions import db
from ..models import ROLE_STUDENT, STATUS_ACTIVE, User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8


def _get_json():
    if not request.is_json:
        return None
    return request.get_json(silent=True)


@auth_bp.post("/register")
def register():
    data = _get_json()
    if data is None or not isinstance(data, dict):
        return jsonify({"message": "Invalid or missing JSON body"}), 400

    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"message": "Name is required"}), 400

    raw_email = data.get("email")
    if raw_email is None or str(raw_email).strip() == "":
        return jsonify({"message": "Email is required"}), 400

    email = str(raw_email).strip().lower()
    if not EMAIL_REGEX.match(email):
        return jsonify({"message": "Invalid email format"}), 400

    password = data.get("password")
    if password is None or str(password) == "":
        return jsonify({"message": "Password is required"}), 400

    if len(str(password)) < MIN_PASSWORD_LENGTH:
        return jsonify({"message": f"Password must be at least {MIN_PASSWORD_LENGTH} characters"}), 400

    if User.query.filter_by(email=email).first() is not None:
        return jsonify({"message": "Email is already registered"}), 409

    user = User(name=name, email=email, role=ROLE_STUDENT, status=STATUS_ACTIVE)
    user.set_password(str(password))
    db.session.add(user)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email is already registered"}), 409

    return jsonify({"message": "Registration successful", "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    data = _get_json()
    if data is None or not isinstance(data, dict):
        return jsonify({"message": "Invalid or missing JSON body"}), 400

    raw_email = data.get("email")
    if raw_email is None or str(raw_email).strip() == "":
        return jsonify({"message": "Email is required"}), 400

    password = data.get("password")
    if password is None or str(password) == "":
        return jsonify({"message": "Password is required"}), 400

    email = str(raw_email).strip().lower()
    user = User.query.filter_by(email=email).first()

    if user is None or not user.check_password(str(password)):
        return jsonify({"message": "Invalid email or password"}), 401

    if user.status != STATUS_ACTIVE:
        return jsonify({"message": "Account is inactive"}), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role},
    )

    return jsonify(
        {
            "message": "Login successful",
            "access_token": access_token,
            "user": user.to_dict(),
        }
    ), 200


@auth_bp.post("/logout")
@jwt_required()
def logout():
    return jsonify({"message": "Logout successful"}), 200


@profile_bp.route("", methods=["GET"], strict_slashes=False)
@profile_bp.route("/", methods=["GET"], strict_slashes=False)
@jwt_required()
def get_user_profile():
    user_id = get_jwt_identity()
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid token identity"}), 401

    user = db.session.get(User, user_id_int)
    if not user or user.status != STATUS_ACTIVE:
        return jsonify({"message": "User not found or inactive"}), 401

    return jsonify({"user": user.to_dict()}), 200


@profile_bp.route("", methods=["PUT", "PATCH"], strict_slashes=False)
@profile_bp.route("/", methods=["PUT", "PATCH"], strict_slashes=False)
@jwt_required()
def update_user_profile():
    user_id = get_jwt_identity()
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid token identity"}), 401

    user = db.session.get(User, user_id_int)
    if not user or user.status != STATUS_ACTIVE:
        return jsonify({"message": "User not found or inactive"}), 401

    data = _get_json()
    if data is None or not isinstance(data, dict):
        return jsonify({"message": "Invalid or missing JSON body"}), 400

    raw_name = data.get("name")
    if raw_name is not None:
        name = str(raw_name).strip()
        if not name:
            return jsonify({"message": "Name is required"}), 400
        if len(name) > 120:
            return jsonify({"message": "Name must not exceed 120 characters"}), 400
        user.name = name
    elif request.method == "PUT":
        return jsonify({"message": "Name is required"}), 400

    raw_email = data.get("email")
    if raw_email is not None:
        if str(raw_email).strip() == "":
            return jsonify({"message": "Email is required"}), 400
        email = str(raw_email).strip().lower()
        if not EMAIL_REGEX.match(email):
            return jsonify({"message": "Invalid email format"}), 400
        existing = User.query.filter(User.email == email, User.id != user.id).first()
        if existing is not None:
            return jsonify({"message": "Email is already registered"}), 409
        user.email = email
    elif request.method == "PUT":
        return jsonify({"message": "Email is required"}), 400

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email is already registered"}), 409

    return jsonify({"message": "Profile updated successfully", "user": user.to_dict()}), 200


@auth_bp.route("/profile", methods=["GET"], strict_slashes=False)
@jwt_required()
def auth_get_profile():
    return get_user_profile()


@auth_bp.route("/profile", methods=["PUT", "PATCH"], strict_slashes=False)
@jwt_required()
def auth_update_profile():
    return update_user_profile()

