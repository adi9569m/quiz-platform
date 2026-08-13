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
    STATUS_COMPLETED,
    STATUS_PASSED,
    STATUS_FAILED,
    STATUS_EXPIRED,
)

attempt_bp = Blueprint("attempt", __name__, url_prefix="/api/attempts")


def finalize_and_score_attempt(attempt, is_expired=False):
    """
    Backend scoring logic:
    Calculates marks, percentage, pass/fail status, correct/incorrect/unanswered,
    time_taken, and persists the result atomically in DB.
    """
    now = datetime.utcnow()

    # Time taken calculation
    if is_expired or (attempt.expires_at and now >= attempt.expires_at):
        time_seconds = int((attempt.expires_at - attempt.started_at).total_seconds())
    else:
        time_seconds = int((now - attempt.started_at).total_seconds())

    attempt.time_taken = max(0, time_seconds)
    attempt.completed_at = now

    total_marks = 0
    obtained_marks = 0
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0

    answers_by_q = {ans.question_id: ans for ans in attempt.answers}

    for q in attempt.quiz.questions:
        q_marks = q.marks if (q.marks is not None) else 1
        total_marks += q_marks

        ans = answers_by_q.get(q.id)
        selected_option_id = ans.selected_option_id if ans else None

        correct_option = next((opt for opt in q.options if opt.is_correct), None)

        if selected_option_id is None:
            unanswered_count += 1
            if ans:
                ans.is_correct = False
        else:
            if correct_option and selected_option_id == correct_option.id:
                correct_count += 1
                obtained_marks += q_marks
                if ans:
                    ans.is_correct = True
            else:
                incorrect_count += 1
                if ans:
                    ans.is_correct = False

    attempt.total_marks = total_marks
    attempt.obtained_marks = obtained_marks
    attempt.correct_answers = correct_count
    attempt.incorrect_answers = incorrect_count
    attempt.unanswered = unanswered_count

    if total_marks > 0:
        attempt.percentage = round((obtained_marks / float(total_marks)) * 100.0, 2)
    else:
        attempt.percentage = 0.0

    passing_score = attempt.quiz.passing_score if attempt.quiz else 0
    if attempt.percentage >= passing_score:
        attempt.status = STATUS_PASSED
    else:
        if is_expired and attempt.status == STATUS_IN_PROGRESS:
            attempt.status = STATUS_EXPIRED
        else:
            attempt.status = STATUS_FAILED

    db.session.commit()
    return attempt


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
        finalize_and_score_attempt(attempt, is_expired=True)

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
            finalize_and_score_attempt(attempt, is_expired=True)
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


@attempt_bp.post("/<int:attempt_id>/submit")
@student_required()
def submit_attempt(attempt_id):
    user_id = get_jwt_identity()
    attempt = db.session.get(Attempt, attempt_id)
    if not attempt:
        return jsonify({"message": "Attempt not found"}), 404

    if attempt.user_id != int(user_id):
        return jsonify({"message": "Forbidden: attempt does not belong to user"}), 403

    if attempt.status != STATUS_IN_PROGRESS:
        return jsonify({"message": "Attempt has already been submitted"}), 409

    now = datetime.utcnow()
    is_expired = now >= attempt.expires_at

    attempt = finalize_and_score_attempt(attempt, is_expired=is_expired)

    return jsonify(attempt.to_dict(include_questions=False)), 200


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
        finalize_and_score_attempt(attempt, is_expired=True)

    res = attempt.to_dict(include_questions=False)
    res["message"] = "Attempt timed out"
    return jsonify(res), 200

