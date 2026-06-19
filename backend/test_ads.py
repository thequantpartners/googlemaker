import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from models import GoogleAdsCredential
from encryption import decrypt_value
from services.google_ads_service import fetch_accessible_customers
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    engine = create_async_engine(f"sqlite+aiosqlite:///saas.db")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(select(GoogleAdsCredential))
        creds = result.scalars().all()
        if creds:
            cred = creds[-1]
            rt = decrypt_value(cred.refresh_token)
            print("Refresh Token starts with:", rt[:10])
            customers = fetch_accessible_customers(rt)
            print("Accessible customers:", customers)
        else:
            print("No creds found")

asyncio.run(main())
