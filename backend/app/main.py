from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import victim_routes, responder_routes, incidents_routes, hospitals_routes, websocket_routes
from app.routers import resource_finder_routes
from app.routers import admin_routes
from app.routers import pipeline_routes

app = FastAPI(title="GuardianAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(victim_routes.router, prefix="/api/victim", tags=["victim"])
app.include_router(responder_routes.router, prefix="/api/responder", tags=["responder"])
app.include_router(incidents_routes.router, prefix="/api/incidents", tags=["incidents"])
app.include_router(hospitals_routes.router, prefix="/api/hospitals", tags=["hospitals"])
app.include_router(websocket_routes.router, tags=["websocket"])
app.include_router(pipeline_routes.router, prefix="/api/pipeline", tags=["pipeline"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["admin"])
@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(resource_finder_routes.router, prefix="/api/resource", tags=["resource"])
