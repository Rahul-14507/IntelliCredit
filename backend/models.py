from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from database import Base
from uuid import uuid4
import datetime

class Entity(Base):
    __tablename__ = "entities"
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))

    # Stage 1 — Company Identity
    company_name       = Column(String, nullable=False)
    cin                = Column(String)           # 21-char e.g. L17110MH1973PLC019786
    pan                = Column(String)           # 10-char e.g. AAACR5055K
    incorporation_year = Column(Integer)
    registered_address = Column(Text)
    website            = Column(String)
    credit_rating      = Column(String)           # AAA / AA+ / BB / Unrated

    # Stage 1 — Business Profile
    sector             = Column(String)           # Banking/NBFC/Manufacturing/...
    sub_sector         = Column(String)
    annual_turnover_cr = Column(Float)
    employee_count     = Column(Integer)

    # Stage 1 — Loan Details
    loan_type          = Column(String)           # Term Loan / Working Capital / CC / OD / LC / BG
    loan_amount_cr     = Column(Float, nullable=False)
    loan_tenure_months = Column(Integer)
    interest_rate_pct  = Column(Float)
    loan_purpose       = Column(Text)
    collateral         = Column(Text)

    # Pipeline status
    status             = Column(String, default="onboarding")
    # onboarding → documents → schema → analysis → complete

    created_at         = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at         = Column(DateTime, default=datetime.datetime.utcnow,
                                onupdate=datetime.datetime.utcnow)

    documents = relationship("Document", back_populates="entity", cascade="all, delete-orphan")
    analysis  = relationship("Analysis", back_populates="entity", uselist=False,
                              cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"
    id         = Column(String, primary_key=True, default=lambda: str(uuid4()))
    entity_id  = Column(String, ForeignKey("entities.id"), nullable=False)
    filename   = Column(String, nullable=False)
    file_path  = Column(String, nullable=False)
    file_size  = Column(Integer)                 # bytes
    mime_type  = Column(String)

    # Stage 2 — Raw Extraction
    raw_text           = Column(Text)
    raw_tables         = Column(JSON)            # list of 2D arrays
    page_count         = Column(Integer)
    extraction_status  = Column(String, default="pending")
    # pending → extracting → done → error
    extraction_error   = Column(Text)

    # Stage 3A — Classification
    predicted_doc_type   = Column(String)
    # ALM | Shareholding | Borrowing | AnnualReport | Portfolio
    predicted_confidence = Column(Float)
    predicted_reasoning  = Column(Text)
    predicted_signals    = Column(JSON)          # list of key signals found
    confirmed_doc_type   = Column(String)        # set after human approval
    classification_status = Column(String, default="pending")
    # pending → classified → confirmed → rejected

    # Stage 3B — Schema
    schema_fields        = Column(JSON)          # user-edited schema definition
    schema_locked        = Column(Boolean, default=False)

    # Stage 3C — Extraction
    extracted_data       = Column(JSON)          # structured dict matching schema
    extraction_confidence = Column(Float)
    extraction_notes     = Column(JSON)          # fields that were unclear
    schema_status        = Column(String, default="pending")
    # pending → extracting → done → error

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    entity     = relationship("Entity", back_populates="documents")


class Analysis(Base):
    __tablename__ = "analyses"
    id        = Column(String, primary_key=True, default=lambda: str(uuid4()))
    entity_id = Column(String, ForeignKey("entities.id"), nullable=False, unique=True)

    # Stage 4A — Tavily Research
    news_results      = Column(JSON)   # [{title, url, content, score, published_date}]
    legal_results     = Column(JSON)   # [{title, url, content, score}]
    macro_results     = Column(JSON)   # [{title, url, content, score}]
    sentiment         = Column(JSON)   # {overall, score, positive_signals, risk_signals, red_flags}
    research_status   = Column(String, default="pending")

    # Stage 4B — AI Scoring
    scores            = Column(JSON)   # {financial_health, asset_quality, governance, liquidity, market_position, overall}
    grade             = Column(String)
    recommendation    = Column(String) # APPROVE | CONDITIONAL_APPROVE | REJECT
    reasoning_chain   = Column(JSON)   # [{step, factor, evidence, signal, impact}]

    # Stage 4C — Outputs
    swot              = Column(JSON)   # {strengths, weaknesses, opportunities, threats}
    triangulation     = Column(JSON)   # cross-doc consistency findings
    key_risks         = Column(JSON)
    mitigants         = Column(JSON)
    conditions        = Column(JSON)

    # Loan recommendation
    recommended_limit_cr      = Column(Float)
    recommended_rate_pct      = Column(Float)
    recommended_tenure_months = Column(Integer)

    executive_summary = Column(Text)
    analysis_status   = Column(String, default="pending")
    created_at        = Column(DateTime, default=datetime.datetime.utcnow)

    entity = relationship("Entity", back_populates="analysis")
