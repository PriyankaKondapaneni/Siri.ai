import time
import bcrypt
import jwt

from app.config import JWT_SECRET, JWT_ALG, JWT_EXPIRES_DAYS


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def sign_token(payload: dict) -> str:
    now = int(time.time())
    body = {
        **payload,
        "iat": now,
        "exp": now + JWT_EXPIRES_DAYS * 24 * 60 * 60,
    }
    return jwt.encode(body, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
