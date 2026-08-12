import click
from flask import Flask

from .config import Config
from .extensions import db, jwt, cors


def create_app(config_override=None):
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)
    if config_override:
        app.config.update(config_override)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)

    from flask import jsonify

    @jwt.unauthorized_loader
    def custom_unauthorized_callback(err_str):
        return jsonify({"message": err_str or "Missing authorization header"}), 401

    @jwt.invalid_token_loader
    def custom_invalid_token_callback(err_str):
        return jsonify({"message": err_str or "Invalid token"}), 401

    @jwt.expired_token_loader
    def custom_expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"message": "Token has expired"}), 401

    # Import models so SQLAlchemy metadata knows about them
    from . import models  # noqa: F401

    with app.app_context():
        db.create_all()

        # Seed categories & admin user on server startup in non-testing mode
        if not app.config.get("TESTING"):
            from .models.category import Category
            initial_cats = ["Geography", "Indian History", "Programming", "General Knowledge", "Trivia"]
            try:
                for cat_name in initial_cats:
                    if not Category.query.filter(db.func.lower(Category.name) == cat_name.lower()).first():
                        c = Category(name=cat_name, description=f"{cat_name} Category")
                        db.session.add(c)
                db.session.commit()
            except Exception:
                db.session.rollback()

            from .models import User, ROLE_ADMIN, STATUS_ACTIVE
            try:
                admin = User.query.filter_by(role=ROLE_ADMIN).first()
                if not admin:
                    admin = User(
                        name="System Admin",
                        email="admin@example.com",
                        role=ROLE_ADMIN,
                        status=STATUS_ACTIVE
                    )
                    admin.set_password("AdminPassword123")
                    db.session.add(admin)
                    db.session.commit()
            except Exception:
                db.session.rollback()

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.admin import admin_bp
    from .routes.student import student_bp
    from .routes.quiz import quiz_bp
    from .routes.category import category_bp
    from .routes.question import question_bp
    from .routes.attempt import attempt_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(question_bp)
    app.register_blueprint(attempt_bp)

    # Basic test route
    @app.route("/")
    def home():
        return {
            "message": "Quiz Platform API is running"
        }

    @app.route("/api/health")
    def health():
        return {
            "status": "ok"
        }

    @app.route("/api/db-test")
    def db_test():
        try:
            db.session.execute(db.text("SELECT 1"))
            return {"status": "ok", "database": "connected"}
        except Exception:
            return {"status": "error", "database": "unreachable"}, 500

    @app.cli.command("init-db")
    def init_db_command():
        """Create all database tables."""
        with app.app_context():
            db.create_all()
        click.echo("Database tables created.")

    @app.cli.command("seed-admin")
    def seed_admin_command():
        """Seed a default admin user if one does not exist."""
        from .models import User, ROLE_ADMIN, STATUS_ACTIVE
        with app.app_context():
            db.create_all()
            admin = User.query.filter_by(role=ROLE_ADMIN).first()
            if admin:
                click.echo(f"Admin account already exists: {admin.email}")
            else:
                admin = User(
                    name="System Admin",
                    email="admin@example.com",
                    role=ROLE_ADMIN,
                    status=STATUS_ACTIVE
                )
                admin.set_password("AdminPassword123")
                db.session.add(admin)
                db.session.commit()
                click.echo("Admin account created successfully.")
                click.echo("Email: admin@example.com")
                click.echo("Password: AdminPassword123")

    @app.cli.command("seed-data")
    def seed_data_command():
        """Seed initial categories, quizzes, and 100 questions."""
        from seed_data import seed_all
        with app.app_context():
            seed_all()
        click.echo("Seed data populated successfully.")

    return app
