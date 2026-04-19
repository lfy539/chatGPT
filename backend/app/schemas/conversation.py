from datetime import datetime
from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    title: str | None = Field(None, max_length=255)


class ConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    reasoning_content: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationListItem(BaseModel):
    id: int
    title: str
    model: str
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationDetail(BaseModel):
    id: int
    title: str
    model: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse]

    class Config:
        from_attributes = True
