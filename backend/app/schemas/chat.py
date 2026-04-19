from pydantic import BaseModel, Field, field_validator


class ChatCompletionRequest(BaseModel):
    conversation_id: int | None = None
    content: str = Field(..., min_length=1, max_length=32000)
    enable_thinking: bool = True
    model: str = Field(default="deepseek-chat")

    @field_validator("model")
    @classmethod
    def validate_model(cls, v: str) -> str:
        allowed = {"deepseek-chat", "deepseek-coder", "deepseek-reasoner"}
        return v if v in allowed else "deepseek-chat"
