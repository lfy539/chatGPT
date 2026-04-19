import json
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.core.config import get_settings
from app.core import CurrentUser
from app.core.database import async_session_maker
from app.models import Conversation, Message
from app.schemas import ChatCompletionRequest
from app.services import ai_service

router = APIRouter()
settings = get_settings()


def _sse(obj: dict) -> str:
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


@router.post("/completions")
async def chat_completions(body: ChatCompletionRequest, current_user: CurrentUser):
    """流式对话（SSE）。首包 meta，随后 reasoning / content，结束 done + [DONE]"""
    if not settings.deepseek_api_key:
        raise HTTPException(status_code=503, detail="未配置 DeepSeek API Key")

    async def generate():
        try:
            use_model = body.model
            async with async_session_maker() as db:
                if body.conversation_id is not None:
                    result = await db.execute(
                        select(Conversation).where(
                            Conversation.id == body.conversation_id,
                            Conversation.user_id == current_user.id,
                        )
                    )
                    conv = result.scalar_one_or_none()
                    if not conv:
                        yield _sse({"type": "error", "message": "会话不存在"})
                        return
                    conv.model = use_model
                else:
                    raw = body.content.strip()
                    title = (raw[:40] if raw else "新对话").replace("\n", " ")
                    if len(raw) > 40:
                        title += "…"
                    conv = Conversation(
                        user_id=current_user.id,
                        title=title,
                        model=use_model,
                    )
                    db.add(conv)
                    await db.commit()
                    await db.refresh(conv)

                user_msg = Message(
                    conversation_id=conv.id,
                    role="user",
                    content=body.content,
                )
                db.add(user_msg)
                await db.commit()
                await db.refresh(user_msg)

                hist = await db.execute(
                    select(Message)
                    .where(Message.conversation_id == conv.id)
                    .order_by(Message.created_at.desc())
                    .limit(30)
                )
                recent = list(reversed(hist.scalars().all()))
                api_messages = [{"role": m.role, "content": m.content} for m in recent]

                conv_id = conv.id
                user_msg_id = user_msg.id

            yield _sse(
                {
                    "type": "meta",
                    "conversation_id": conv_id,
                    "user_message_id": user_msg_id,
                }
            )

            reasoning_acc = ""
            content_acc = ""

            try:
                async for evt in ai_service.stream_deepseek_chat(
                    api_messages,
                    enable_thinking=body.enable_thinking,
                    model=use_model,
                ):
                    yield _sse(evt)
                    if evt["type"] == "reasoning":
                        reasoning_acc += evt["content"]
                    elif evt["type"] == "content":
                        content_acc += evt["content"]
            except Exception as e:
                yield _sse({"type": "error", "message": str(e)})
                return

            async with async_session_maker() as db2:
                asst = Message(
                    conversation_id=conv_id,
                    role="assistant",
                    content=content_acc,
                    reasoning_content=reasoning_acc or None,
                )
                db2.add(asst)
                crow = await db2.execute(select(Conversation).where(Conversation.id == conv_id))
                cobj = crow.scalar_one()
                cobj.updated_at = datetime.utcnow()
                await db2.commit()
                await db2.refresh(asst)
                assistant_id = asst.id

            yield _sse(
                {
                    "type": "done",
                    "conversation_id": conv_id,
                    "assistant_message_id": assistant_id,
                }
            )
            yield "data: [DONE]\n\n"

        except Exception as e:
            yield _sse({"type": "error", "message": str(e)})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
