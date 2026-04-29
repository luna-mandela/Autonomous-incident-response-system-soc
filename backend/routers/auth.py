from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
import models, database, security
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    honeypot: str = "" # Anti-bot measure

class UserLogin(BaseModel):
    email: str
    password: str
    honeypot: str = ""

class OTPVerify(BaseModel):
    email: str
    otp_code: str

def send_otp_to_user(email: str, otp_code: str):
    """
    Placeholder function for sending OTP via email.
    Prints to console with high visibility.
    """
    print("\n" + "="*50)
    print(f" SECURITY ALERT: OTP GENERATED FOR {email} ")
    print(f" YOUR CODE IS: {otp_code} ")
    print("="*50 + "\n")

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    if user.honeypot:
        return {"msg": "Registration successful"}

    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = security.get_password_hash(user.password)
    mfa_secret = security.generate_mfa_secret()

    new_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        mfa_secret=mfa_secret,
        role=models.UserRole.User
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"msg": "Registration successful", "mfa_secret": mfa_secret}

@router.post("/login")
def login(user_credentials: UserLogin, db: Session = Depends(database.get_db)):
    if user_credentials.honeypot:
        return {"msg": "OTP sent"}

    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user or not security.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=403, detail="Invalid Credentials")

    otp_code = security.generate_mfa_code(user.mfa_secret)
    send_otp_to_user(user.email, otp_code)
    
    return {
        "msg": "OTP sent. Please verify."
    }

@router.post("/verify-otp")
def verify_otp(otp_data: OTPVerify, response: Response, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == otp_data.email).first()
    if not user:
        raise HTTPException(status_code=403, detail="Invalid Credentials")

    if not security.verify_mfa_code(user.mfa_secret, otp_data.otp_code):
        raise HTTPException(status_code=403, detail="Invalid OTP")

    access_token = security.create_access_token(data={"sub": user.id, "role": user.role.value})
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=security.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {"msg": "Login successful", "role": user.role.value, "name": user.name}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"msg": "Logged out"}
