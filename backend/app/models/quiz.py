from datetime import datetime
from ..extensions import db

STATUS_DRAFT = "DRAFT"
STATUS_PUBLISHED = "PUBLISHED"

PREDEFINED_CATEGORIES = {
    1: "Geography",
    2: "Indian History",
    3: "Programming",
    4: "General Knowledge (GK)",
    5: "Trivia"
}

VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"]


def get_category_id_and_name(val):
    if val is None:
        return None, None

    # Check if integer or digit string matching existing category_id
    try:
        cat_id = int(val)
        if cat_id in PREDEFINED_CATEGORIES:
            return cat_id, PREDEFINED_CATEGORIES[cat_id]
    except (ValueError, TypeError):
        pass

    # Check if string matching category name (case-insensitive)
    if isinstance(val, str):
        val_clean = val.strip().lower()
        for c_id, c_name in PREDEFINED_CATEGORIES.items():
            if c_name.lower() == val_clean:
                return c_id, c_name

    return None, None


class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    passing_score = db.Column(db.Integer, nullable=False)
    max_attempts = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default=STATUS_DRAFT)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def category_name(self):
        return PREDEFINED_CATEGORIES.get(self.category_id, "Unknown")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description or "",
            "category_id": self.category_id,
            "category": self.category_name,
            "difficulty": self.difficulty,
            "duration": self.duration,
            "passing_score": self.passing_score,
            "max_attempts": self.max_attempts,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
