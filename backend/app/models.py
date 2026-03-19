from sqlalchemy import Column, Date, Float, Integer, String

from .database import Base


class DepartmentRevenue(Base):
    __tablename__ = "department_revenue"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(String, nullable=False)
    engineering = Column(Float, nullable=False)
    design = Column(Float, nullable=False)
    marketing = Column(Float, nullable=False)


class UserGrowth(Base):
    __tablename__ = "user_growth"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(String, nullable=False)
    users = Column(Integer, nullable=False)
    sessions = Column(Integer, nullable=False)


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, nullable=False)
    joined = Column(Date, nullable=False)


class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(String, nullable=False)
    submitted_at = Column(String, nullable=False)
