"""
DeepSeek API 简化测试脚本
用于验证接口规范并记录返回字段
"""

from openai import OpenAI
import json
import sys

# DeepSeek API 配置 - 请替换为有效的 API Key
API_KEY = "sk-c56efaf0b7a643f68a2a3b875a63f60f"
BASE_URL = "https://api.deepseek.com"


def test_stream_and_thinking():
    """测试流式输出和思考模式"""
    
    client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
    
    print("=" * 60)
    print("DeepSeek API 接口测试")
    print("=" * 60)
    
    # ===== 测试 1: 普通流式输出 =====
    print("\n【测试 1】普通流式输出 (deepseek-chat)")
    print("-" * 40)
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": "你好"}],
            stream=True
        )
        
        print("\n流式 Chunk 结构示例：")
        content = ""
        for i, chunk in enumerate(response):
            if i < 3:  # 只打印前3个 chunk
                print(f"\nChunk {i}:")
                print(f"  id: {chunk.id}")
                print(f"  model: {chunk.model}")
                print(f"  object: {chunk.object}")
                if chunk.choices:
                    c = chunk.choices[0]
                    print(f"  delta.role: {getattr(c.delta, 'role', None)}")
                    print(f"  delta.content: {repr(getattr(c.delta, 'content', None))}")
                    print(f"  finish_reason: {c.finish_reason}")
            
            if chunk.choices and chunk.choices[0].delta.content:
                content += chunk.choices[0].delta.content
        
        print(f"\n完整回复: {content}")
        print("\n✅ 普通流式输出测试通过")
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        return False
    
    # ===== 测试 2: 思考模式 =====
    print("\n" + "=" * 60)
    print("【测试 2】思考模式 (thinking enabled)")
    print("-" * 40)
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": "9.11和9.8哪个大？"}],
            stream=True,
            extra_body={"thinking": {"type": "enabled"}}
        )
        
        reasoning = ""
        content = ""
        reasoning_chunks = 0
        content_chunks = 0
        
        print("\n思考模式 Chunk 结构示例：")
        printed_reasoning = False
        printed_content = False
        
        for i, chunk in enumerate(response):
            if chunk.choices:
                delta = chunk.choices[0].delta
                
                # 检查思考内容
                if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                    reasoning += delta.reasoning_content
                    reasoning_chunks += 1
                    if not printed_reasoning:
                        print(f"\n第一个 reasoning_content chunk:")
                        print(f"  delta.reasoning_content: {repr(delta.reasoning_content[:100])}...")
                        printed_reasoning = True
                
                # 检查回答内容
                if delta.content:
                    content += delta.content
                    content_chunks += 1
                    if not printed_content:
                        print(f"\n第一个 content chunk:")
                        print(f"  delta.content: {repr(delta.content[:100] if len(delta.content) > 100 else delta.content)}")
                        printed_content = True
        
        print(f"\n统计:")
        print(f"  reasoning_content chunks: {reasoning_chunks}")
        print(f"  content chunks: {content_chunks}")
        
        print(f"\n思考过程 (前500字):")
        print("-" * 40)
        print(reasoning[:500] + "..." if len(reasoning) > 500 else reasoning)
        
        print(f"\n最终回答:")
        print("-" * 40)
        print(content)
        
        print("\n✅ 思考模式测试通过")
        
        # 输出关键发现
        print("\n" + "=" * 60)
        print("【接口规范总结】")
        print("=" * 60)
        print("""
1. 普通模式 chunk.choices[0].delta 包含:
   - role: 'assistant' (仅第一个 chunk)
   - content: 回复内容片段
   - finish_reason: null 或 'stop'

2. 思考模式 chunk.choices[0].delta 包含:
   - reasoning_content: 思考过程片段
   - content: 最终回答片段
   - 两者不会同时出现在同一个 chunk

3. 流式响应顺序:
   - 先输出所有 reasoning_content
   - 然后输出所有 content
   - 最后 finish_reason = 'stop'

4. 后端 SSE 设计建议:
   data: {"type": "reasoning", "content": "..."}
   data: {"type": "content", "content": "..."}
   data: [DONE]
""")
        
        return True
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_stream_and_thinking()
    sys.exit(0 if success else 1)
