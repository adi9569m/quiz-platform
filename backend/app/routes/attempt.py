from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from ..extensions import db
from ..middleware import student_required
from ..models import (
    Attempt,
    AttemptAnswer,
    Question,
    QuestionOption,
    STATUS_IN_PROGRESS,
    STATUS_EXPIRED,
)

attempt_bp = Blueprint("attempt", __name__, url_prefix="/api/attempts")


@attempt_bp.get("/<int:attempt_id>")
@student_required()
def get_attempt(attempt_id):
    user_id = get_jwt_identity()
    attempt = db.session.get(Attempt, attempt_id)
    if not attempt:
        return jsonify({"message": "Attempt not found"}), 404

    if attempt.user_id != int(user_id):
        return jsonify({"message": "Forbidden: attempt does not belong to user"}), 403

    if attempt.status == STATUS_IN_PROGRESS and datetime.utcnow() > attempt.expires_at:
        attempt.status = STATUS_EXPIRED
        db.session.commit()

    return jsonify(attempt.to_dict(include_questions=True)), 200


@attempt_bp.post("/<int:attempt_id>/answers")
@student_required()
def save_answer(attempt_id):
    user_id = get_jwt_identity()
    attempt = db.session.get(Attempt, attempt_id)
    if not attempt:
        return jsonify({"message": "Attempt not found"}), 404

    if attempt.user_id != int(user_id):
        return jsonify({"message": "Forbidden: attempt does not belong to user"}), 403

    if attempt.status != STATUS_IN_PROGRESS or datetime.utcnow() > attempt.expires_at:
        if attempt.status == STATUS_IN_PROGRESS:
            attempt.status = STATUS_EXPIRED
            db.session.commit()
        return jsonify({"message": "Attempt is no longer active"}), 400

    data = request.get_json() or {}
    question_id = data.get("question_id")
    selected_option_id = data.get("selected_option_id")

    if not question_id:
        return jsonify({"message": "question_id is required"}), 400

    question = db.session.get(Question, question_id)
    if not question or question.quiz_id != attempt.quiz_id:
        return jsonify({"message": "Invalid question for this quiz"}), 400

    if selected_option_id is not None:
        option = db.session.get(QuestionOption, selected_option_id)
        if not option or option.question_id != question_id:
            return jsonify({"message": "Invalid option for this question"}), 400

    ans = AttemptAnswer.query.filter_by(attempt_id=attempt.id, question_id=question_id).first()
    if not ans:
        ans = AttemptAnswer(attempt_id=attempt.id, question_id=question_id)
        db.session.add(ans)

    ans.selected_option_id = selected_option_id
    ans.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Answer saved", "answers": attempt.get_answers_dict()}), 200


@attempt_bp.post("/<int:attempt_id>/timeout")
@student_required()
def timeout_attempt(attempt_id):
    user_id = get_jwt_identity()
    attempt = db.session.get(Attempt, attempt_id)
    if not attempt:
        return jsonify({"message": "Attempt not found"}), 404

    if attempt.user_id != int(user_id):
        return jsonify({"message": "Forbidden: attempt does not belong to user"}), 403

    if attempt.status == STATUS_IN_PROGRESS:
        attempt.status = STATUS_EXPIRED
        attempt.completed_at = datetime.utcnow()
        db.session.commit()

    return jsonify({
        "message": "Attempt timed out",
        "status": attempt.status,
        "attempt_id": attempt.id
    }), 200
