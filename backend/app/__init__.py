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

    return app