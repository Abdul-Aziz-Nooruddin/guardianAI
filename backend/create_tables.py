import asyncio
from app.db.postgres import engine
from app.models.incident import Base
from app.models import report, hospital, user  # noqa: ensures models are registered

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created.")

asyncio.run(main())