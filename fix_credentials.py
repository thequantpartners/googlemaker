import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath('backend'))
from database import async_session
from models import GoogleAdsCredential
from encryption import decrypt_value
from sqlalchemy import select

async def run():
    async with async_session() as db:
        res = await db.execute(select(GoogleAdsCredential))
        creds = res.scalars().all()
        deleted = 0
        for c in creds:
            try:
                decrypt_value(c.target_customer_id)
                decrypt_value(c.refresh_token)
            except Exception:
                await db.delete(c)
                deleted += 1
        if deleted > 0:
            await db.commit()
            print(f"Deleted {deleted} corrupted credentials.")
        else:
            print("No corrupted credentials found.")

if __name__ == "__main__":
    asyncio.run(run())
