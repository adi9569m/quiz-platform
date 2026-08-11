import click
from flask import Flask

from .config import Config
from .extensions import db, jwt, cors


def create_app():
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

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

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.admin import admin_bp
    from .routes.student import student_bp
    from .routes.quiz import quiz_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(quiz_bp)

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

    return app

