from datetime import datetime
from flask import Blueprint, jsonify, request

from ..extensions import db
from ..middleware import admin_required
from ..models.category import Category
from ..models.quiz import Quiz

category_bp = Blueprint("category", __name__, url_prefix="/api/categories")


@category_bp.get("")
@admin_required()
def list_categories():
    categories = Category.query.order_by(Category.id.asc()).all()
    return jsonify([c.to_dict() for c in categories]), 200


@category_bp.get("/<int:category_id>")
@admin_required()
def get_category(category_id):
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({"message": "Category not found"}), 404

    return jsonify({"category": category.to_dict()}), 200


@category_bp.post("")
@admin_required()
def create_category():
    data = request.get_json() or {}
    name = data.get("name")

    if not name or not isinstance(name, str) or not name.strip():
        return jsonify({"message": "Validation failed", "errors": ["Category name is required."]}), 400

    name_clean = name.strip()

    # Check for duplicate name (case-insensitive)
    existing = Category.query.filter(db.func.lower(Category.name) == name_clean.lower()).first()
    if existing:
        return jsonify({"message": "Category name already exists"}), 400

    category = Category(
        name=name_clean,
        description=(data.get("description") or "").strip(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.session.add(category)
    db.session.commit()

    return jsonify({"message": "Category created successfully", "category": category.to_dict()}), 201


@category_bp.put("/<int:category_id>")
@admin_required()
def edit_category(category_id):
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({"message": "Category not found"}), 404

    data = request.get_json() or {}
    name = data.get("name")

    if "name" in data:
        if not name or not isinstance(name, str) or not name.strip():
            return jsonify({"message": "Validation failed", "errors": ["Category name cannot be empty."]}), 400

        name_clean = name.strip()
        existing = Category.query.filter(
            db.func.lower(Category.name) == name_clean.lower(),
            Category.id != category_id
        ).first()

        if existing:
            return jsonify({"message": "Category name already exists"}), 400

        category.name = name_clean

    if "description" in data:
        category.description = (data.get("description") or "").strip()

    category.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Category updated successfully", "category": category.to_dict()}), 200


@category_bp.delete("/<int:category_id>")
@admin_required()
def delete_category(category_id):
    category = db.session.get(Category, category_id)
    if not category:
        return jsonify({"message": "Category not found"}), 404

    # Check if any quiz is associated with this category
    associated_quiz = Quiz.query.filter_by(category_id=category_id).first()
    if associated_quiz:
        return jsonify({
            "message": "Cannot delete category associated with active quizzes. Please reassign or delete quizzes first."
        }), 400

    db.session.delete(category)
    db.session.commit()

    return jsonify({"message": "Category deleted successfully"}), 200
