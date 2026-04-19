"""DeepSeek 流式对话（OpenAI 兼容接口）"""

from typing import AsyncIterator

from openai import AsyncOpenAI

from app.core.config import get_settings

settings = get_settings()


async def stream_deepseek_chat(
    messages: list[dict[str, str]],
    *,
    enable_thinking: bool,
    model: str | None = None,
) -> AsyncIterator[dict]:
    """
    流式输出，yield 统一事件字典供 SSE 封装：
    - {"type": "reasoning", "content": str}
    - {"type": "content", "content": str}
    """
    if not settings.deepseek_api_key:
        raise RuntimeError("未配置 DeepSeek API Key，请在环境变量 DEEPSEEK_API_KEY 中设置")

    client = AsyncOpenAI(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
    )
    use_model = model or "deepseek-chat"

    kwargs: dict = {
        "model": use_model,
        "messages": messages,
        "stream": True,
    }
    # deepseek-reasoner 自带推理链，勿再叠加 thinking；chat/coder 可用官方 thinking
    use_thinking_extra = enable_thinking and use_model in (
        "deepseek-chat",
        "deepseek-coder",
    )
    if use_thinking_extra:
        kwargs["extra_body"] = {"thinking": {"type": "enabled"}}

    stream = await client.chat.completions.create(**kwargs)

    async for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta

        rc = getattr(delta, "reasoning_content", None)
        if rc:
            yield {"type": "reasoning", "content": rc}

        if delta.content:
            yield {"type": "content", "content": delta.content}
