import socketio
from services.brain import analyze_message, generate_ai_response
from database import SessionLocal
import models
from contextlib import contextmanager

@contextmanager
def get_db_context():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="*")

# Simple in-memory store for connected users
connected_users = {}

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def register_user(sid, data):
    user_id = data.get('user_id')
    if user_id:
        connected_users[user_id] = sid
        print(f"User {user_id} registered with sid {sid}")

@sio.event
async def disconnect(sid):
    for user_id, s_id in list(connected_users.items()):
        if s_id == sid:
            del connected_users[user_id]
            break
    print(f"Client disconnected: {sid}")

@sio.event
async def send_message(sid, data):
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    message = data.get('message')

    # 1. Toxic Analysis
    with get_db_context() as db:
        is_toxic = analyze_message(db, sender_id, message)

    if is_toxic:
        await sio.emit('warning', {'msg': 'Message blocked: Potential toxicity detected by AIRS Brain.'}, to=sid)
        return

    # 2. AI Response Logic
    # If the message is intended for the AI (or if it's the support lead in this demo)
    if receiver_id == "airs_support_lead" or "ai" in receiver_id.lower():
        # Generate AI Response
        ai_reply = generate_ai_response(message)
        
        # Simulate a slight delay for "thinking"
        import asyncio
        await asyncio.sleep(1)
        
        await sio.emit('receive_message', {
            'sender_id': 'airs_ai',
            'message': ai_reply
        }, to=sid)
        return

    # 3. Direct Peer-to-Peer Messaging
    receiver_sid = connected_users.get(receiver_id)
    if receiver_sid:
        await sio.emit('receive_message', {
            'sender_id': sender_id,
            'message': message
        }, to=receiver_sid)
