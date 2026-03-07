from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()

def uuid4_str():
    return str(uuid.uuid4())

class Application(Base):
    __tablename__ = "applications"
    id = Column(String, primary_key=True, default=uuid4_str)
    company_name = Column(String, nullable=False)
    cin = Column(String, nullable=False)
    industry = Column(String)
    requested_limit = Column(Float, nullable=False)  # always in Crores
    status = Column(String, default="pending")  # pending/processing/completed/failed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    documents = relationship("Document", back_populates="application")
    analysis = relationship("Analysis", back_populates="application", uselist=False)

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=uuid4_str)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    original_filename = Column(String)
    file_path = Column(String)
    extracted_text = Column(Text)          # raw text from Azure DI
    extraction_status = Column(String, default="pending")  # pending/done/failed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    application = relationship("Application", back_populates="documents")

class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(String, primary_key=True, default=uuid4_str)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False, unique=True)
    # Raw GPT-4o response stored as JSON
    raw_result = Column(JSON, nullable=False)
    # Denormalised fields for fast frontend queries
    total_score = Column(Integer)
    grade = Column(String)
    recommended_action = Column(String)
    suggested_limit_crores = Column(Float)
    interest_rate = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    application = relationship("Application", back_populates="analysis")

class PrimaryInsight(Base):
    __tablename__ = "primary_insights"
    id = Column(String, primary_key=True, default=uuid4_str)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    officer_name = Column(String)
    notes_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
