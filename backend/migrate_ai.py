import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    db_url = "sqlite+aiosqlite:///saas.db"
    
    engine = create_async_engine(db_url)
    async with engine.begin() as conn:
        print("Executing migration...")
        try:
            await conn.execute(text("ALTER TABLE chat_widget_configs ADD COLUMN ai_apply_chat_widget BOOLEAN NOT NULL DEFAULT 1;"))
            print("Added ai_apply_chat_widget")
        except Exception as e:
            print(f"Error adding ai_apply_chat_widget: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE chat_widget_configs ADD COLUMN ai_apply_whatsapp BOOLEAN NOT NULL DEFAULT 1;"))
            print("Added ai_apply_whatsapp")
        except Exception as e:
            print(f"Error adding ai_apply_whatsapp: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE chat_widget_configs ADD COLUMN ai_goals JSON DEFAULT '[]';"))
            print("Added ai_goals")
        except Exception as e:
            print(f"Error adding ai_goals: {e}")
            
        print("Migration done.")

if __name__ == "__main__":
    asyncio.run(main())
