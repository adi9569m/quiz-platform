from datetime import datetime
from ..extensions import db
from .category import Category

STATUS_DRAFT = "DRAFT"
STATUS_PUBLISHED = "PUBLISHED"

VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"]

# Mapping for legacy Day 5 category lookup fallback
PREDEFINED_CATEGORIES = {
    1: "Geography",
    2: "Indian History",
    3: "Programming",
    4: "General Knowledge",
    5: "Trivia"
}


def get_category_id_and_name(val):
    if val is None:
        return None, None

    # Check if integer ID or numeric string
    try:
        cat_id = int(val)
        cat = db.session.get(Category, cat_id)
        if cat:
            return cat.id, cat.name
        # Fallback to predefined if DB category not found yet
        if cat_id in PREDEFINED_CATEGORIES:
            return cat_id, PREDEFINED_CATEGORIES[cat_id]
    except (ValueError, TypeError):
        pass

    # Check if string matching category name
    if isinstance(val, str):
        val_clean = val.strip().lower()
        # Handle "General Knowledge (GK)" alias for Day 5 test compatibility
        if val_clean in ["general knowledge (gk)", "gk", "general knowledge"]:
            val_clean = "general knowledge"

        # Query DB for category by name case-insensitive
        cat = Category.query.filter(db.func.lower(Category.name) == val_clean).first()
        if cat:
            return cat.id, cat.name

        # Fallback matching predefined list
        for c_id, c_name in PREDEFINED_CATEGORIES.items():
            if c_name.lower() == val_clean or (c_name == "General Knowledge" and val_clean == "general knowledge (gk)"):
                return c_id, c_name

    return None, None


class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    difficulty = db.Column(db.String(20), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    passing_score = db.Column(db.Integer, nullable=False)
    max_attempts = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default=STATUS_DRAFT)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to Category
    category_rel = db.relationship("Category", backref=db.backref("quizzes", lazy=True))

    # Relationship to Question with cascade delete
    questions = db.relationship("Question", backref="quiz", cascade="all, delete-orphan", lazy=True)

    @property
    def category_name(self):
        if self.category_rel:
            return self.category_rel.name
        cat = db.session.get(Category, self.category_id)
        if cat:
            return cat.name
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
