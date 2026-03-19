from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DepartmentRevenueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    month: str
    Engineering: float = Field(validation_alias="engineering")
    Design: float = Field(validation_alias="design")
    Marketing: float = Field(validation_alias="marketing")


class UserGrowthOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    month: str
    Users: int = Field(validation_alias="users")
    Sessions: int = Field(validation_alias="sessions")


class TeamMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    role: str
    status: Literal["Active", "Inactive", "Pending"]
    joined: date


class ContactIn(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    message: str = Field(min_length=10)


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    message: str
    submitted_at: str
