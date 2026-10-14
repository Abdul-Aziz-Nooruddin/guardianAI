from fastapi import APIRouter
from pydantic import BaseModel
from app.agents.victim_assistance.agent import process_victim_message

router = APIRouter()

class VictimMessage(BaseModel):
    message: str
    user_id: str

@router.post("/message")
async def receive_message(payload: VictimMessage):
    result = await process_victim_message(payload.message, payload.user_id)
    return result