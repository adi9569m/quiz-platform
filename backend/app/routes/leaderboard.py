from flask import Blueprint, jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from ..extensions import db
from ..models import User, Quiz, Category, Attempt, ROLE_STUDENT, STATUS_ACTIVE, STATUS_IN_PROGRESS

leaderboard_bp = Blueprint("leaderboard", __name__, url_prefix="/api/leaderboard")


@leaderboard_bp.get("")
def get_leaderboard():
    verify_jwt_in_request()
    current_user_id = None
    try:
        current_user_id = int(get_jwt_identity())
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid token identity"}), 401

    caller = db.session.get(User, current_user_id)
    if not caller or caller.status != STATUS_ACTIVE:
        return jsonify({"message": "User not found or inactive"}), 401

    category_id_param = request.args.get("category_id")
    category = None

    if category_id_param is not None and str(category_id_param).strip() != "":
        try:
            cat_id = int(category_id_param)
        except (ValueError, TypeError):
            return jsonify({"message": "Category not found"}), 404

        category = db.session.get(Category, cat_id)
        if not category:
            return jsonify({"message": "Category not found"}), 404

    query = db.session.query(
        User.id.label("student_id"),
        User.name.label("student_name"),
        db.func.avg(Attempt.percentage).label("avg_score"),
        db.func.count(Attempt.id).label("quizzes_completed")
    ).join(Attempt, Attempt.user_id == User.id)\
     .join(Quiz, Quiz.id == Attempt.quiz_id)\
     .filter(
         User.role == ROLE_STUDENT,
         Attempt.status != STATUS_IN_PROGRESS
     )

    if category:
        query = query.filter(Quiz.category_id == category.id)

    query = query.group_by(User.id, User.name)\
                 .order_by(
                     db.func.avg(Attempt.percentage).desc(),
                     db.func.count(Attempt.id).desc(),
                     User.id.asc()
                 )

    results = query.all()

    ranked_students = []
    user_rank_info = None

    for idx, row in enumerate(results, start=1):
        avg_score = round(float(row.avg_score), 2) if row.avg_score is not None else 0.0
        quizzes_completed = int(row.quizzes_completed)

        entry = {
            "rank": idx,
            "student_id": row.student_id,
            "student_name": row.student_name,
            "average_score": avg_score,
            "quizzes_completed": quizzes_completed,
        }

        if row.student_id == current_user_id:
            user_rank_info = entry

        ranked_students.append(entry)

    limit = request.args.get("limit", 10, type=int)
    if limit is None or limit <= 0:
        limit = 10

    displayed_leaderboard = ranked_students[:limit]

    response_data = {
        "leaderboard": displayed_leaderboard,
        "user_rank": user_rank_info,
        "total_participants": len(ranked_students),
    }

    if category:
        response_data["category"] = {
            "id": category.id,
            "name": category.name,
        }

    return jsonify(response_data), 200
