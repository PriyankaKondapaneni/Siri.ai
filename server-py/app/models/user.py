from pydantic import BaseModel, EmailStr


class User(BaseModel):
    id: str
    email: str
    name: str


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: User
