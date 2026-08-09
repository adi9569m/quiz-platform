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

    # Import models so SQLAlchemy metadata knows about them
    from . import models  # noqa: F401

    # Register blueprints
    from .routes.auth import auth_bp

    app.register_blueprint(auth_bp)

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

    return app
