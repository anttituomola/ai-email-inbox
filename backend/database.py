from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
import os
from base import Base
from models import Email
from seed_data import seed_database

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./inbox.db")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        result = await session.execute(select(Email))
        if result.scalars().first() is None:
            await seed_database(session)
        await session.commit()


async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
