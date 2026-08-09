import os
from datetime import timedelta

from dotenv import load_dotenv


BASE_DIR = os.path.abspath(os.path.dirname(__file__))
ENV_PATH = os.path.join(os.path.dirname(BASE_DIR), ".env")

load_dotenv(ENV_PATH)


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "24"))
    )
