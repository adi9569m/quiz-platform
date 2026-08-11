import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app, db
from app.models import User, ROLE_ADMIN, ROLE_STUDENT, STATUS_ACTIVE


@pytest.fixture
def app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test_secret_key_32bytes_long_secret_key!"
    })
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def student_user(app):
    with app.app_context():
        user = User(
            name="Test Student",
            email="student@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE
        )
        user.set_password("StudentPass123")
        db.session.add(user)
        db.session.commit()
        return {"id": user.id, "email": user.email, "password": "StudentPass123", "role": user.role}


@pytest.fixture
def admin_user(app):
    with app.app_context():
        user = User(
            name="Test Admin",
            email="admin@example.com",
            role=ROLE_ADMIN,
            status=STATUS_ACTIVE
        )
        user.set_password("AdminPass123")
        db.session.add(user)
        db.session.commit()
        return {"id": user.id, "email": user.email, "password": "AdminPass123", "role": user.role}
