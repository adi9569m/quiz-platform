from datetime import datetime
from flask import Blueprint, jsonify, request

from ..extensions import db
from ..middleware import admin_required
from ..models.quiz import Quiz
from ..models.question import Question, QuestionOption, QUESTION_TYPE_MCQ, VALID_QUESTION_TYPES, VALID_OPTION_KEYS

question_bp = Blueprint("question", __name__, url_prefix="/api")


def validate_question_data(data, is_update=False):
    errors = []

    if "question_text" in data or not is_update:
        q_text = data.get("question_text")
        if not q_text or not isinstance(q_text, str) or not q_text.strip():
            errors.append("Question text is required and cannot be empty.")

    if "question_type" in data or not is_update:
        q_type = data.get("question_type") or QUESTION_TYPE_MCQ
        if not isinstance(q_type, str) or q_type.upper() not in VALID_QUESTION_TYPES:
            errors.append(f"Question type must be one of: {', '.join(VALID_QUESTION_TYPES)}.")

    if "marks" in data or not is_update:
        marks = data.get("marks")
        try:
            marks_val = int(marks)
            if marks_val <= 0:
                errors.append("Marks must be a positive integer greater than 0.")
        except (ValueError, TypeError):
            errors.append("Marks must be a valid integer.")

    if "options" in data or not is_update:
        options = data.get("options")
        if not isinstance(options, list) or len(options) != 4:
            errors.append("Multiple-choice questions must have exactly four options.")
        else:
            found_keys = []
            correct_count = 0
            for idx, opt in enumerate(options):
                if not isinstance(opt, dict):
                    errors.append(f"Option {idx + 1} must be an object.")
                    continue

                key = opt.get("key") or opt.get("option_key")
                text = opt.get("text") or opt.get("option_text")
                is_correct = opt.get("is_correct")

                if not key or not isinstance(key, str) or key.upper() not in VALID_OPTION_KEYS:
                    errors.append(f"Option key at index {idx} must be one of A, B, C, D.")
                else:
                    found_keys.append(key.upper())

                if text is None or not isinstance(text, str) or not text.strip():
                    errors.append(f"Option {key or idx+1} text cannot be empty.")

                if is_correct is True or str(is_correct).lower() == "true":
                    correct_count += 1

            if len(set(found_keys)) != len(found_keys):
                errors.append("Duplicate option keys are not allowed.")

            if set(found_keys) != set(VALID_OPTION_KEYS) and len(found_keys) == 4:
                errors.append("Option keys must be exactly A, B, C, D.")

            if correct_count == 0:
                errors.append("Exactly one option must be marked as correct. Zero correct options provided.")
            elif correct_count > 1:
                errors.append("Exactly one option must be marked as correct. Multiple correct options provided.")

    return errors


@question_bp.get("/quizzes/<int:quiz_id>/questions")
@admin_required()
def list_questions(quiz_id):
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), 404

    questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.id.asc()).all()
    return jsonify([q.to_dict(include_correct=True) for q in questions]), 200


@question_bp.post("/quizzes/<int:quiz_id>/questions")
@admin_required()
def create_question(quiz_id):
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return jsonify({"message": "Quiz not found"}), 404

    data = request.get_json() or {}
    errors = validate_question_data(data, is_update=False)
    if errors:
        return jsonify({"message": "Validation failed", "errors": errors}), 400

    q_text = data["question_text"].strip()
    q_type = (data.get("question_type") or QUESTION_TYPE_MCQ).upper()
    marks = int(data["marks"])

    question = Question(
        quiz_id=quiz_id,
        question_text=q_text,
        question_type=q_type,
        marks=marks,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.session.add(question)
    db.session.flush()

    for opt_data in data["options"]:
        key = (opt_data.get("key") or opt_data.get("option_key")).upper()
        text = (opt_data.get("text") or opt_data.get("option_text")).strip()
        is_corr = bool(opt_data.get("is_correct"))

        option = QuestionOption(
            question_id=question.id,
            option_key=key,
            option_text=text,
            is_correct=is_corr,
            created_at=datetime.utcnow(),
        )
        db.session.add(option)

    db.session.commit()

    return jsonify({"message": "Question created successfully", "question": question.to_dict(include_correct=True)}), 201


@question_bp.get("/questions/<int:question_id>")
@admin_required()
def get_question(question_id):
    question = db.session.get(Question, question_id)
    if not question:
        return jsonify({"message": "Question not found"}), 404

    return jsonify({"question": question.to_dict(include_correct=True)}), 200


@question_bp.put("/questions/<int:question_id>")
@admin_required()
def edit_question(question_id):
    question = db.session.get(Question, question_id)
    if not question:
        return jsonify({"message": "Question not found"}), 404

    data = request.get_json() or {}
    errors = validate_question_data(data, is_update=True)
    if errors:
        return jsonify({"message": "Validation failed", "errors": errors}), 400

    if "question_text" in data:
        question.question_text = data["question_text"].strip()
    if "question_type" in data:
        question.question_type = data["question_type"].upper()
    if "marks" in data:
        question.marks = int(data["marks"])

    if "options" in data:
        QuestionOption.query.filter_by(question_id=question_id).delete()
        db.session.flush()

        for opt_data in data["options"]:
            key = (opt_data.get("key") or opt_data.get("option_key")).upper()
            text = (opt_data.get("text") or opt_data.get("option_text")).strip()
            is_corr = bool(opt_data.get("is_correct"))

            option = QuestionOption(
                question_id=question.id,
                option_key=key,
                option_text=text,
                is_correct=is_corr,
                created_at=datetime.utcnow(),
            )
            db.session.add(option)

    question.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Question updated successfully", "question": question.to_dict(include_correct=True)}), 200


@question_bp.delete("/questions/<int:question_id>")
@admin_required()
def delete_question(question_id):
    question = db.session.get(Question, question_id)
    if not question:
        return jsonify({"message": "Question not found"}), 404

    db.session.delete(question)
    db.session.commit()

    return jsonify({"message": "Question deleted successfully"}), 200
