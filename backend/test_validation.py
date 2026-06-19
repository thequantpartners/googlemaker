import asyncio
from database import async_session
from models import User, UserRole
from schemas import ClientOut
from sqlalchemy import select

async def main():
    async with async_session() as db:
        try:
            result = await db.execute(
                select(User).where(User.role == UserRole.client).order_by(User.created_at.desc())
            )
            users = result.scalars().all()
            for u in users:
                # Test pydantic validation
                client_out = ClientOut.model_validate(u)
                print("Validated:", client_out.email)
            print("Done")
        except Exception as e:
            print("Validation error:", repr(e))

asyncio.run(main())
