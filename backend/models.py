from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from base import Base


class GuestProfile(Base):
    __tablename__ = "guest_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    
    emails = relationship("Email", back_populates="guest")


class Email(Base):
    __tablename__ = "emails"
    
    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, ForeignKey("guest_profiles.id"))
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    received_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="open")  # open, needs_review, resolved
    
    # Reply data
    draft_text = Column(Text, default="")
    sent_reply = Column(Text, default="")
    sent_at = Column(DateTime, nullable=True)
    
    guest = relationship("GuestProfile", back_populates="emails")


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
