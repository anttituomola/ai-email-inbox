from datetime import datetime, timedelta, timezone
from models import GuestProfile, Email, KnowledgeEntry
from sqlalchemy.ext.asyncio import AsyncSession


HOTEL_KNOWLEDGE = [
    {
        "topic": "check_in",
        "content": "Check-in time is 3:00 PM. Guests must present a valid ID and credit card at arrival."
    },
    {
        "topic": "check_out",
        "content": "Check-out time is 11:00 AM. Late check-out may be available upon request, subject to availability."
    },
    {
        "topic": "early_check_in",
        "content": "Early check-in is available from 12:00 PM for an additional fee of $50, subject to room availability."
    },
    {
        "topic": "late_arrival",
        "content": "For arrivals after 10:00 PM, please notify the front desk. Late check-in is available 24/7."
    },
    {
        "topic": "spa_access",
        "content": "The spa is open daily from 8:00 AM to 8:00 PM. Reservations are recommended. Hotel guests receive complimentary access to the sauna and steam room."
    },
    {
        "topic": "parking",
        "content": "On-site parking is available for $25 per night. Valet service is $40 per night. Electric vehicle charging stations are available."
    },
    {
        "topic": "breakfast",
        "content": "Complimentary continental breakfast is served from 6:30 AM to 10:00 AM in the Garden Restaurant. Full American breakfast is available for an additional $18."
    },
    {
        "topic": "pets",
        "content": "We are a pet-friendly hotel. Pets up to 50 lbs are welcome for a fee of $75 per stay. Pet beds and bowls are available upon request."
    },
    {
        "topic": "cancellation",
        "content": "Reservations must be cancelled 48 hours before check-in for a full refund. Cancellations within 48 hours incur a charge for the first night."
    },
]


GUEST_PROFILES = [
    {
        "name": "Sarah Johnson",
        "email": "sarah.j@email.com"
    },
    {
        "name": "Michael Chen",
        "email": "mchen@email.com"
    },
    {
        "name": "Emma Williams",
        "email": "emma.w@email.com"
    },
    {
        "name": "David Martinez",
        "email": "d.martinez@email.com"
    },
    {
        "name": "Lisa Anderson",
        "email": "lisa.a@email.com"
    },
]


# Emails with varying answerability
GUEST_EMAILS = [
    # Fully answerable - single question
    {
        "subject": "Question about check-in time",
        "body": "Hi there,\n\nI'm arriving next Tuesday and wanted to confirm what time I can check in. My flight lands at 1 PM.\n\nThanks,\nSarah",
        "guest_idx": 0,
        "status": "open"
    },
    # Fully answerable - multiple questions
    {
        "subject": "Spa and breakfast questions",
        "body": "Hello,\n\nWe're looking forward to our stay next weekend. Could you let me know:\n\n1. What are the spa hours?\n2. Is breakfast included in our room rate?\n\nBest regards,\nEmma",
        "guest_idx": 2,
        "status": "open"
    },
    # Partially answerable - one question supported, one not
    {
        "subject": "Parking and airport shuttle",
        "body": "Hi,\n\nI'll be driving to the hotel and need parking. What's the rate? Also, do you offer an airport shuttle service?\n\nThanks,\nMichael",
        "guest_idx": 1,
        "status": "open"
    },
    # Unsupported question
    {
        "subject": "Restaurant reservation needed",
        "body": "Hello,\n\nWe're celebrating our anniversary and would like to make a reservation at your restaurant for Friday at 7 PM for 4 people. Can you help with this?\n\nThanks,\nDavid",
        "guest_idx": 3,
        "status": "open"
    },
    # Mixed - some supported, one unsupported
    {
        "subject": "Bringing my dog and need late checkout",
        "body": "Hi,\n\nI'm planning to bring my golden retriever (45 lbs) on my upcoming stay. Is that okay?\n\nAlso, I'll need a late checkout on Sunday - what time can I stay until and is there a charge?\n\nOne more thing - can I get a room with a balcony view of the pool?\n\nThanks,\nLisa",
        "guest_idx": 4,
        "status": "open"
    },
    # Fully answerable - cancellation
    {
        "subject": "Need to cancel reservation",
        "body": "Dear Hotel Team,\n\nI need to cancel my reservation for March 20-22 due to a change in plans. I booked 3 days ago. Will I receive a full refund?\n\nRegards,\nSarah",
        "guest_idx": 0,
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
