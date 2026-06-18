import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("No DATABASE_URL found!")
        return
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://")
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
        
    engine = create_async_engine(db_url)
    async with engine.begin() as conn:
        print("Executing update...")
        await conn.execute(text("UPDATE users SET tier='none' WHERE tier='free' OR tier='pro' OR tier='enterprise';"))
        print("Updated successfully.")

if __name__ == "__main__":
    asyncio.run(main())
