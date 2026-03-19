from datetime import datetime

from sqlalchemy.orm import Session

from . import models


def get_revenue(db: Session) -> list[models.DepartmentRevenue]:
    return db.query(models.DepartmentRevenue).order_by(models.DepartmentRevenue.id).all()


def get_growth(db: Session) -> list[models.UserGrowth]:
    return db.query(models.UserGrowth).order_by(models.UserGrowth.id).all()


def get_members(db: Session) -> list[models.TeamMember]:
    return db.query(models.TeamMember).order_by(models.TeamMember.id).all()


def create_contact(db: Session, name: str, email: str, message: str) -> models.ContactSubmission:
    submission = models.ContactSubmission(
        name=name,
        email=email,
        message=message,
        submitted_at=datetime.utcnow().isoformat(),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission
