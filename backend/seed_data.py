from datetime import datetime, timedelta, timezone
from models import GuestProfile, Email, KnowledgeEntry
from sqlalchemy.ext.asyncio import AsyncSession


HOTEL_KNOWLEDGE = [
    {
        "topic": "early_check_in",
        "content": "Early check-in may be possible from 12:00 PM, subject to room availability."
    },
    {
        "topic": "parking",
        "content": "On-site parking is available at the hotel."
    },
    {
        "topic": "spa_access",
        "content": "Spa access is included for hotel guests. The spa is open daily from 8:00 AM to 8:00 PM."
    },
    {
        "topic": "late_arrival",
        "content": "A staff member is available for check-in even after midnight."
    },
]


GUEST_PROFILES = [
    {
        "name": "Sarah Johnson",
        "email": "sarah.johnson@email.com"
    },
    {
        "name": "Michael Weber",
        "email": "michael.weber@email.com"
    },
    {
        "name": "Emma Larsen",
        "email": "emma.larsen@email.com"
    },
]


GUEST_EMAILS = [
    {
        "subject": "Early check-in and parking",
        "body": "Hi, we’re arriving around 11:30 tomorrow. Is early check-in possible? Also, do you have parking available at the hotel?",
        "guest_idx": 0,
        "status": "open"
    },
    {
        "subject": "Spa access",
        "body": "Hello, I’m staying with you this weekend. Is spa access included in the room price, and what are the opening hours?",
        "guest_idx": 1,
        "status": "open"
    },
    {
        "subject": "Late arrival",
        "body": "Hi, our flight lands very late and we may not arrive until after midnight. Will someone still be available for check-in?",
        "guest_idx": 2,
        "status": "open"
    },
]


async def seed_database(session: AsyncSession):
    # Seed knowledge entries
    for entry in HOTEL_KNOWLEDGE:
        knowledge = KnowledgeEntry(topic=entry["topic"], content=entry["content"])
        session.add(knowledge)
    
    # Create guest profiles
    guest_objects = []
    for profile in GUEST_PROFILES:
        guest = GuestProfile(
            name=profile["name"],
            email=profile["email"]
        )
        session.add(guest)
        guest_objects.append(guest)
    
    await session.flush()  # Get IDs for guests
    
    # Create emails
    base_time = datetime.now(timezone.utc) - timedelta(days=2)
    for i, email_data in enumerate(GUEST_EMAILS):
        guest = guest_objects[email_data["guest_idx"]]
        email = Email(
            guest_id=guest.id,
            subject=email_data["subject"],
            body=email_data["body"],
            received_at=base_time + timedelta(hours=i * 4),
            status=email_data["status"],
            draft_text="",
            sent_reply="",
            sent_at=None
        )
        session.add(email)
    
    await session.commit()
