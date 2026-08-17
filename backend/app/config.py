import os
from datetime import timedelta
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.dirname(BASE_DIR)

load_dotenv(os.path.join(BACKEND_DIR, ".env"))
load_dotenv(os.path.join(os.getcwd(), ".env"))

DEFAULT_DB_URI = "postgresql://postgres:12e345678@127.0.0.1:5432/quiz_platform"
FALLBACK_FILE_DB = f"sqlite:///{os.path.join(BACKEND_DIR, 'quiz_platform.db')}"


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or DEFAULT_DB_URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or "quiz_jwtkey_12345678"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "24"))
    )
