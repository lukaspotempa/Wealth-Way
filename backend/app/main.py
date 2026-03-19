from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, SessionLocal, engine
from . import models
from .routers import dashboard, contact


def _seed_db(db) -> None:
    """Populate tables with initial data if they are empty."""
    if db.query(models.DepartmentRevenue).count() > 0:
        return

    revenue_rows = [
        models.DepartmentRevenue(month="Jan", engineering=42000, design=28000, marketing=19000),
        models.DepartmentRevenue(month="Feb", engineering=47500, design=31000, marketing=21500),
        models.DepartmentRevenue(month="Mar", engineering=51000, design=29500, marketing=24000),
        models.DepartmentRevenue(month="Apr", engineering=55000, design=33000, marketing=22000),
        models.DepartmentRevenue(month="May", engineering=60000, design=36500, marketing=26500),
        models.DepartmentRevenue(month="Jun", engineering=64000, design=38000, marketing=29000),
    ]

    growth_rows = [
        models.UserGrowth(month="Jan", users=1200,  sessions=3800),
        models.UserGrowth(month="Feb", users=1850,  sessions=5200),
        models.UserGrowth(month="Mar", users=2400,  sessions=6900),
        models.UserGrowth(month="Apr", users=2900,  sessions=8100),
        models.UserGrowth(month="May", users=3600,  sessions=10400),
        models.UserGrowth(month="Jun", users=4500,  sessions=13200),
    ]

    member_rows = [
        models.TeamMember(name="Alice Chen",  role="Engineering", status="Active",   joined=date(2024, 1, 15)),
        models.TeamMember(name="Ben Müller",  role="Design",      status="Active",   joined=date(2024, 2, 3)),
        models.TeamMember(name="Carla Rossi", role="Product",     status="Inactive", joined=date(2023, 11, 20)),
        models.TeamMember(name="David Park",  role="Engineering", status="Active",   joined=date(2024, 3, 8)),
        models.TeamMember(name="Eva Novak",   role="Marketing",   status="Pending",  joined=date(2024, 4, 22)),
        models.TeamMember(name="Frank Osei",  role="Engineering", status="Active",   joined=date(2023, 9, 11)),
    ]

    db.add_all(revenue_rows + growth_rows + member_rows)
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed_db(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Wealth Manager ", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://investmentgame.de", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(contact.router)

from .routers.lobby import router as lobby_router
app.include_router(lobby_router)
