from datetime import datetime
from ..extensions import db

STATUS_IN_PROGRESS = "IN_PROGRESS"
STATUS_COMPLETED = "COMPLETED"
STATUS_PASSED = "PASSED"
STATUS_FAILED = "FAILED"
STATUS_EXPIRED = "EXPIRED"


class Attempt(db.Model):
    __tablename__ = "attempts"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default=STATUS_IN_PROGRESS)

    total_marks = db.Column(db.Integer, nullable=False, default=0)
    obtained_marks = db.Column(db.Integer, nullable=False, default=0)
    percentage = db.Column(db.Float, nullable=False, default=0.0)
    correct_answers = db.Column(db.Integer, nullable=False, default=0)
    incorrect_answers = db.Column(db.Integer, nullable=False, default=0)
    unanswered = db.Column(db.Integer, nullable=False, default=0)
    time_taken = db.Column(db.Integer, nullable=False, default=0)

    quiz = db.relationship("Quiz", backref=db.backref("attempts", lazy=True))
    user = db.relationship("User", backref=db.backref("attempts", lazy=True))
    answers = db.relationship("AttemptAnswer", backref="attempt", cascade="all, delete-orphan", lazy=True)

    def get_answers_dict(self):
        """Returns a dict mapping question_id -> selected_option_id"""
        return {ans.question_id: ans.selected_option_id for ans in self.answers}

    def to_dict(self, include_questions=True):
        def _to_utc_iso(dt):
            if not dt:
                return None
            s = dt.isoformat()
            return s + "Z" if not s.endswith("Z") else s

        res = {
            "id": self.id,
            "attempt_id": self.id,
            "quiz_id": self.quiz_id,
            "user_id": self.user_id,
            "started_at": _to_utc_iso(self.started_at),
            "expires_at": _to_utc_iso(self.expires_at),
            "completed_at": _to_utc_iso(self.completed_at),
            "status": self.status,
            "duration_minutes": self.quiz.duration if self.quiz else None,
            "passing_score": self.quiz.passing_score if self.quiz else None,
            "total_questions": len(self.quiz.questions) if (self.quiz and self.quiz.questions) else 0,
            "answers": self.get_answers_dict(),
        }

        if self.status != STATUS_IN_PROGRESS:
            res.update({
                "correct_answers": self.correct_answers,
                "incorrect_answers": self.incorrect_answers,
                "unanswered": self.unanswered,
                "total_marks": self.total_marks,
                "obtained_marks": self.obtained_marks,
                "percentage": self.percentage,
                "time_taken": self.time_taken,
            })

        if include_questions and self.quiz:
            sorted_questions = sorted(self.quiz.questions, key=lambda q: q.id)
            res["questions"] = [q.to_dict(include_correct=False) for q in sorted_questions]

        return res


class AttemptAnswer(db.Model):
    __tablename__ = "attempt_answers"

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    selected_option_id = db.Column(db.Integer, db.ForeignKey("question_options.id", ondelete="CASCADE"), nullable=True)
    is_correct = db.Column(db.Boolean, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "attempt_id": self.attempt_id,
            "question_id": self.question_id,
            "selected_option_id": self.selected_option_id,
            "is_correct": self.is_correct,
        }
