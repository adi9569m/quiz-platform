from datetime import datetime
from ..extensions import db

QUESTION_TYPE_MCQ = "MCQ"
VALID_QUESTION_TYPES = [QUESTION_TYPE_MCQ]
VALID_OPTION_KEYS = ["A", "B", "C", "D"]


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False, default=QUESTION_TYPE_MCQ)
    marks = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to QuestionOption with cascade delete
    options = db.relationship(
        "QuestionOption",
        backref="question",
        cascade="all, delete-orphan",
        order_by="QuestionOption.id",
        lazy="joined"
    )

    def to_dict(self, include_correct=True):
        # Sort options by option_key in A, B, C, D order if possible
        sorted_opts = sorted(
            self.options,
            key=lambda opt: VALID_OPTION_KEYS.index(opt.option_key) if opt.option_key in VALID_OPTION_KEYS else 99
        )
        return {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "question_text": self.question_text,
            "question_type": self.question_type,
            "marks": self.marks,
            "options": [opt.to_dict(include_correct=include_correct) for opt in sorted_opts],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class QuestionOption(db.Model):
    __tablename__ = "question_options"

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    option_text = db.Column(db.Text, nullable=False)
    option_key = db.Column(db.String(5), nullable=False)  # 'A', 'B', 'C', 'D'
    is_correct = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self, include_correct=True):
        res = {
            "id": self.id,
            "question_id": self.question_id,
            "key": self.option_key,
            "text": self.option_text,
            "option_key": self.option_key,
            "option_text": self.option_text,
        }
        if include_correct:
            res["is_correct"] = self.is_correct
        return res
