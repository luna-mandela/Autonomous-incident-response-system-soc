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

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_otp_to_user(email: str, otp_code: str):
    """
    Sends the OTP code to the user via SMTP.
    Configured via environment variables.
    """
    # Get SMTP settings from environment
    smtp_host = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("EMAIL_PORT", 587))
    smtp_user = os.environ.get("EMAIL_USER")
    smtp_pass = os.environ.get("EMAIL_PASSWORD")

    if not smtp_user or not smtp_pass:
        print("\n" + "!"*50)
        print(" WARNING: EMAIL CREDENTIALS NOT SET ")
        print(f" OTP FOR {email}: {otp_code} ")
        print("!"*50 + "\n")
        return

    try:
        # Create the email
        msg = MIMEMultipart()
        msg['From'] = f"AIRS Security <{smtp_user}>"
        msg['To'] = email
        msg['Subject'] = f"[{otp_code}] Your AIRS Security Access Code"

        # Professional "Cyber" Body
        body = f"""
        <html>
        <body style="background-color: #0a192f; color: #ccd6f6; font-family: 'Courier New', Courier, monospace; padding: 40px; border: 1px solid #64ffda;">
            <div style="text-align: center; border-bottom: 1px solid #112240; padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="color: #64ffda; letter-spacing: 5px;">AIRS SHIELD</h1>
                <p style="font-size: 10px; text-transform: uppercase;">Autonomous Incident Response System</p>
            </div>
            
            <p>A secure login attempt was initiated for your account.</p>
            
            <div style="background-color: #112240; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
                <p style="font-size: 12px; text-transform: uppercase; margin-bottom: 10px; opacity: 0.7;">Your Verification Code:</p>
                <h2 style="font-size: 42px; color: #64ffda; margin: 0; letter-spacing: 10px;">{otp_code}</h2>
            </div>
            
            <p style="font-size: 12px; color: #8892b0;">This code will expire in 15 minutes. If you did not request this code, please ignore this email or contact the SOC team.</p>
            
            <div style="margin-top: 40px; border-top: 1px solid #112240; padding-top: 20px; font-size: 10px; opacity: 0.5;">
                <p>SESSION_ID: {os.urandom(8).hex().upper()}</p>
                <p>STATUS: ENCRYPTED_TRANSMISSION_ACTIVE</p>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        # Send the email
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            
        print(f"--- SUCCESS: OTP Email sent to {email} ---")
        
    except Exception as e:
        print(f"--- FAILED: Could not send email: {str(e)} ---")
        # Fallback to console so user isn't locked out
        print(f" FALLBACK OTP FOR {email}: {otp_code} ")

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
        secure=True,
        samesite="none",
        max_age=security.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {"msg": "Login successful", "role": user.role.value, "name": user.name}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        "access_token", 
        secure=True, 
        samesite="none"
    )
    return {"msg": "Logged out"}
