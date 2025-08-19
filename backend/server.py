from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from bson import ObjectId


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class AttackMove(BaseModel):
    id: str
    name: str
    type: str  # 'hold', 'double', 'triple'
    damage: int
    cooldown: int
    cost: int
    description: str
    color: str
    isOwned: bool = False
    isEquipped: bool = False

class PlayerStats(BaseModel):
    level: int = 1
    xp: int = 0
    xpToNext: int = 100
    health: int = 100
    maxHealth: int = 100
    coins: int = 50

class WorldProgress(BaseModel):
    worldId: int
    unlocked: bool = False
    completed: bool = False
    bestTime: int = 0
    highScore: int = 0

class GameProgress(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    playerId: str
    playerStats: PlayerStats
    equippedMoves: Dict[str, Optional[AttackMove]] = {}
    ownedMoves: List[str] = []
    worldProgress: List[WorldProgress] = []
    deathCount: int = 0
    settings: Dict[str, bool] = {"soundEnabled": True, "musicEnabled": True}
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class GameProgressCreate(BaseModel):
    playerId: str
    playerStats: Optional[PlayerStats] = None

class GameProgressUpdate(BaseModel):
    playerStats: Optional[PlayerStats] = None
    equippedMoves: Optional[Dict[str, Optional[AttackMove]]] = None
    ownedMoves: Optional[List[str]] = None
    worldProgress: Optional[List[WorldProgress]] = None
    deathCount: Optional[int] = None
    settings: Optional[Dict[str, bool]] = None


# Basic endpoints
@api_router.get("/")
async def root():
    return {"message": "Phoenix Flying Game API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Game Progress endpoints
@api_router.post("/game/progress", response_model=GameProgress)
async def create_game_progress(input: GameProgressCreate):
    # Create default game progress
    default_stats = PlayerStats()
    if input.playerStats:
        default_stats = input.playerStats
    
    # Create initial world progress (10 worlds, first unlocked)
    worlds = []
    for i in range(1, 11):
        worlds.append(WorldProgress(
            worldId=i,
            unlocked=(i == 1),
            completed=False,
            bestTime=0,
            highScore=0
        ))
    
    game_progress = GameProgress(
        playerId=input.playerId,
        playerStats=default_stats,
        worldProgress=worlds,
        ownedMoves=["hold_1", "double_1", "triple_1"]  # Starter moves
    )
    
    progress_dict = game_progress.dict()
    progress_dict["_id"] = ObjectId(progress_dict["id"])
    del progress_dict["id"]
    
    result = await db.game_progress.insert_one(progress_dict)
    progress_dict["id"] = str(result.inserted_id)
    del progress_dict["_id"]
    
    return GameProgress(**progress_dict)

@api_router.get("/game/progress/{player_id}", response_model=GameProgress)
async def get_game_progress(player_id: str):
    progress = await db.game_progress.find_one({"playerId": player_id})
    if not progress:
        raise HTTPException(status_code=404, detail="Game progress not found")
    
    progress["id"] = str(progress["_id"])
    del progress["_id"]
    return GameProgress(**progress)

@api_router.put("/game/progress/{player_id}", response_model=GameProgress)
async def update_game_progress(player_id: str, update: GameProgressUpdate):
    # Get existing progress
    existing = await db.game_progress.find_one({"playerId": player_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Game progress not found")
    
    # Update fields
    update_data = update.dict(exclude_unset=True)
    update_data["updatedAt"] = datetime.utcnow()
    
    result = await db.game_progress.update_one(
        {"playerId": player_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Failed to update progress")
    
    # Return updated progress
    updated = await db.game_progress.find_one({"playerId": player_id})
    updated["id"] = str(updated["_id"])
    del updated["_id"]
    return GameProgress(**updated)

@api_router.get("/moves/available")
async def get_available_moves():
    """Get all available moves in the shop"""
    moves = []
    
    # Hold moves
    hold_moves = [
        {"id": "hold_1", "name": "Phoenix Inferno", "type": "hold", "damage": 50, "cooldown": 8000, "cost": 0, "description": "Channel a massive fire beam", "color": "#ff4444"},
        {"id": "hold_2", "name": "Dragon's Breath", "type": "hold", "damage": 75, "cooldown": 10000, "cost": 100, "description": "Intense flame torrent", "color": "#ff2222"},
        {"id": "hold_3", "name": "Solar Flare", "type": "hold", "damage": 100, "cooldown": 12000, "cost": 200, "description": "Blinding solar energy", "color": "#ff2222"},
        {"id": "hold_4", "name": "Inferno Wave", "type": "hold", "damage": 125, "cooldown": 15000, "cost": 350, "description": "Devastating fire wave", "color": "#ff2222"},
        {"id": "hold_5", "name": "Phoenix Nova", "type": "hold", "damage": 150, "cooldown": 18000, "cost": 500, "description": "Explosive nova blast", "color": "#ff2222"},
    ]
    
    # Double click moves
    double_moves = [
        {"id": "double_1", "name": "Fire Dart", "type": "double", "damage": 15, "cooldown": 1500, "cost": 0, "description": "Quick fire projectile", "color": "#ff6644"},
        {"id": "double_2", "name": "Flame Burst", "type": "double", "damage": 20, "cooldown": 1200, "cost": 50, "description": "Rapid fire burst", "color": "#ff6644"},
        {"id": "double_3", "name": "Fire Lance", "type": "double", "damage": 25, "cooldown": 1000, "cost": 100, "description": "Piercing flame spear", "color": "#ff6644"},
        {"id": "double_4", "name": "Spark Storm", "type": "double", "damage": 30, "cooldown": 800, "cost": 150, "description": "Multiple fire sparks", "color": "#ff6644"},
        {"id": "double_5", "name": "Blaze Bullet", "type": "double", "damage": 35, "cooldown": 600, "cost": 250, "description": "High-speed fire bullet", "color": "#ff6644"},
    ]
    
    # Triple click moves
    triple_moves = [
        {"id": "triple_1", "name": "Phoenix Strike", "type": "triple", "damage": 35, "cooldown": 4000, "cost": 0, "description": "Powerful flame burst", "color": "#ff8844"},
        {"id": "triple_2", "name": "Phoenix Claw", "type": "triple", "damage": 45, "cooldown": 3500, "cost": 75, "description": "Powerful claw attack", "color": "#ff8844"},
        {"id": "triple_3", "name": "Flame Tornado", "type": "triple", "damage": 60, "cooldown": 3000, "cost": 150, "description": "Spinning fire vortex", "color": "#ff8844"},
        {"id": "triple_4", "name": "Fire Storm", "type": "triple", "damage": 75, "cooldown": 2500, "cost": 300, "description": "Chaotic flame storm", "color": "#ff8844"},
        {"id": "triple_5", "name": "Solar Bomb", "type": "triple", "damage": 90, "cooldown": 2000, "cost": 450, "description": "Explosive solar energy", "color": "#ff8844"},
    ]
    
    return {
        "moves": hold_moves + double_moves + triple_moves,
        "total": len(hold_moves + double_moves + triple_moves)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
