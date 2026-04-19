from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core import CurrentUser, DbSession
from app.models import Conversation, Message
from app.schemas import ConversationCreate, ConversationUpdate, ConversationListItem, ConversationDetail, MessageResponse

router = APIRouter()


async def _get_owned(db, user_id: int, conversation_id: int) -> Conversation:
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="会话不存在")
    return conv


@router.get("", response_model=list[ConversationListItem])
async def list_conversations(current_user: CurrentUser, db: DbSession):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ConversationListItem, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    body: ConversationCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    conv = Conversation(
        user_id=current_user.id,
        title=body.title.strip() if body.title else "新对话",
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    conv = await _get_owned(db, current_user.id, conversation_id)
    msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
    )
    msgs = msg_result.scalars().all()
    return ConversationDetail(
        id=conv.id,
        title=conv.title,
        model=conv.model,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[MessageResponse.model_validate(m) for m in msgs],
    )


@router.patch("/{conversation_id}", response_model=ConversationListItem)
async def update_conversation(
    conversation_id: int,
    body: ConversationUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    conv = await _get_owned(db, current_user.id, conversation_id)
    conv.title = body.title.strip()
    await db.commit()
    await db.refresh(conv)
    return conv


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    conv = await _get_owned(db, current_user.id, conversation_id)
    await db.delete(conv)
    await db.commit()
    return None
