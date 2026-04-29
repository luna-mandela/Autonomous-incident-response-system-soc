import os
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv()

import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from socketio import ASGIApp

from database import engine, Base
from routers import auth, chat, incidents, scanner
from services.health import monitor_health

# Initialize Database
Base.metadata.create_all(bind=engine)

# Global Rate Limiting
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app = FastAPI(title="Automated Incident Response System (AIRS)")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# WAF/CORS Configuration
# NOTE: allow_origins=["*"] + allow_credentials=True is an invalid CORS combination.
# Browsers will reject it. Use an explicit origin list instead.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://autonomous-incident-response-system-five.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Apply routers
app.include_router(auth.router)
app.include_router(incidents.router)
app.include_router(scanner.router)

# Apply Socket.IO ASGI App
# IMPORTANT: Run with:  uvicorn main:sio_app --reload
# NOT:                  uvicorn main:app --reload
# Socket.IO connections will silently fail if you serve `app` directly.
sio_app = ASGIApp(chat.sio, other_asgi_app=app)

@app.on_event("startup")
async def startup_event():
    # Start health monitor background task
    asyncio.create_task(monitor_health())

@app.get("/")
@limiter.limit("5/minute")
def read_root(request: Request):
    return {"status": "AIRS Backend is Running."}
