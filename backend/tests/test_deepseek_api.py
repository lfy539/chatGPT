"""
DeepSeek API 测试脚本
测试流式输出和思考模式的接口规范
"""

from openai import OpenAI
import json

# DeepSeek API 配置
API_KEY = "sk-c56efaf0b7a643f68a2a3b875a63f60f"
BASE_URL = "https://api.deepseek.com"

client = OpenAI(api_key=API_KEY, base_url=BASE_URL)


def test_basic_stream():
    """测试基础流式输出"""
    print("=" * 60)
    print("测试 1: 基础流式输出 (deepseek-chat)")
    print("=" * 60)
    
    messages = [{"role": "user", "content": "你好，请用一句话介绍自己"}]
    
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True
    )
    
    print("\n--- 流式响应 chunk 详情 ---")
    full_content = ""
    chunk_count = 0
    
    for chunk in response:
        chunk_count += 1
        
        # 打印前5个和最后1个 chunk 的详细结构
        if chunk_count <= 5:
            print(f"\nChunk {chunk_count}:")
            print(f"  id: {chunk.id}")
            print(f"  model: {chunk.model}")
            print(f"  object: {chunk.object}")
            print(f"  created: {chunk.created}")
            
            if chunk.choices:
                choice = chunk.choices[0]
                print(f"  choices[0].index: {choice.index}")
                print(f"  choices[0].delta: {choice.delta}")
                print(f"  choices[0].finish_reason: {choice.finish_reason}")
                
                if choice.delta.content:
                    full_content += choice.delta.content
        else:
            if chunk.choices and chunk.choices[0].delta.content:
                full_content += chunk.choices[0].delta.content
            
            # 打印最后一个 chunk
            if chunk.choices and chunk.choices[0].finish_reason:
                print(f"\n最后一个 Chunk (第 {chunk_count} 个):")
                print(f"  finish_reason: {chunk.choices[0].finish_reason}")
    
    print(f"\n总共收到 {chunk_count} 个 chunks")
    print(f"\n完整回复内容:\n{full_content}")
    
    return full_content


def test_thinking_mode():
    """测试思考模式（带推理过程）"""
    print("\n" + "=" * 60)
    print("测试 2: 思考模式流式输出 (thinking enabled)")
    print("=" * 60)
    
    messages = [{"role": "user", "content": "9.11和9.8哪个大？请仔细思考后回答"}]
    
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        extra_body={"thinking": {"type": "enabled"}}
    )
    
    print("\n--- 思考模式流式响应详情 ---")
    reasoning_content = ""
    final_content = ""
    chunk_count = 0
    has_reasoning = False
    
    for chunk in response:
        chunk_count += 1
        
        if chunk.choices:
            choice = chunk.choices[0]
            delta = choice.delta
            
            # 检查是否有 reasoning_content 字段
            if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                has_reasoning = True
                reasoning_content += delta.reasoning_content
                if chunk_count <= 3:
                    print(f"\nChunk {chunk_count} (思考过程):")
                    print(f"  delta.reasoning_content: {repr(delta.reasoning_content[:100] if len(delta.reasoning_content) > 100 else delta.reasoning_content)}")
            
            # 最终回答内容
            if delta.content:
                final_content += delta.content
                if chunk_count <= 3 or (not has_reasoning and chunk_count <= 5):
                    print(f"\nChunk {chunk_count} (回答内容):")
                    print(f"  delta.content: {repr(delta.content)}")
            
            # 打印完成原因
            if choice.finish_reason:
                print(f"\n最后一个 Chunk (第 {chunk_count} 个):")
                print(f"  finish_reason: {choice.finish_reason}")
    
    print(f"\n总共收到 {chunk_count} 个 chunks")
    print(f"\n是否包含思考过程: {has_reasoning}")
    
    if reasoning_content:
        print(f"\n思考过程内容 (reasoning_content):")
        print("-" * 40)
        print(reasoning_content[:500] + "..." if len(reasoning_content) > 500 else reasoning_content)
    
    print(f"\n最终回答内容 (content):")
    print("-" * 40)
    print(final_content)
    
    return {
        "has_reasoning": has_reasoning,
        "reasoning_content": reasoning_content,
        "final_content": final_content
    }


def test_multi_round():
    """测试多轮对话"""
    print("\n" + "=" * 60)
    print("测试 3: 多轮对话流式输出")
    print("=" * 60)
    
    messages = [{"role": "user", "content": "世界上最高的山是什么？"}]
    
    # Round 1
    print("\n--- 第一轮对话 ---")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True
    )
    
    round1_content = ""
    for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            round1_content += chunk.choices[0].delta.content
    
    print(f"用户: {messages[0]['content']}")
    print(f"AI: {round1_content}")
    
    # 添加助手回复到消息列表
    messages.append({"role": "assistant", "content": round1_content})
    
    # Round 2
    print("\n--- 第二轮对话 ---")
    messages.append({"role": "user", "content": "第二高的呢？"})
    
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True
    )
    
    round2_content = ""
    for chunk in response:
        if chunk.choices and chunk.choices[0].delta.content:
            round2_content += chunk.choices[0].delta.content
    
    print(f"用户: {messages[-1]['content']}")
    print(f"AI: {round2_content}")
    
    return messages


def test_chunk_structure():
    """详细测试 chunk 结构，用于前端对接"""
    print("\n" + "=" * 60)
    print("测试 4: Chunk 结构详细分析（用于前端对接）")
    print("=" * 60)
    
    messages = [{"role": "user", "content": "1+1等于几？"}]
    
    # 测试普通模式
    print("\n--- 普通模式 Chunk 结构 ---")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True
    )
    
    chunks_data = []
    for i, chunk in enumerate(response):
        chunk_dict = {
            "index": i,
            "id": chunk.id,
            "model": chunk.model,
            "object": chunk.object,
            "created": chunk.created,
        }
        
        if chunk.choices:
            choice = chunk.choices[0]
            chunk_dict["choice"] = {
                "index": choice.index,
                "finish_reason": choice.finish_reason,
                "delta": {}
            }
            
            # 记录 delta 的所有属性
            delta = choice.delta
            if hasattr(delta, 'role') and delta.role:
                chunk_dict["choice"]["delta"]["role"] = delta.role
            if hasattr(delta, 'content') and delta.content:
                chunk_dict["choice"]["delta"]["content"] = delta.content
            if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                chunk_dict["choice"]["delta"]["reasoning_content"] = delta.reasoning_content
        
        chunks_data.append(chunk_dict)
    
    print(f"共 {len(chunks_data)} 个 chunks")
    print("\n第一个 chunk (通常包含 role):")
    print(json.dumps(chunks_data[0], indent=2, ensure_ascii=False))
    print("\n中间 chunk (包含内容):")
    for chunk in chunks_data[1:4]:
        print(json.dumps(chunk, indent=2, ensure_ascii=False))
    print("\n最后一个 chunk (包含 finish_reason):")
    print(json.dumps(chunks_data[-1], indent=2, ensure_ascii=False))
    
    # 测试思考模式
    print("\n\n--- 思考模式 Chunk 结构 ---")
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": "2+2等于几？请思考"}],
        stream=True,
        extra_body={"thinking": {"type": "enabled"}}
    )
    
    thinking_chunks = []
    for i, chunk in enumerate(response):
        chunk_dict = {
            "index": i,
            "id": chunk.id,
        }
        
        if chunk.choices:
            choice = chunk.choices[0]
            delta = choice.delta
            chunk_dict["finish_reason"] = choice.finish_reason
            chunk_dict["delta"] = {}
            
            if hasattr(delta, 'role') and delta.role:
                chunk_dict["delta"]["role"] = delta.role
            if hasattr(delta, 'content') and delta.content:
                chunk_dict["delta"]["content"] = delta.content
            if hasattr(delta, 'reasoning_content') and delta.reasoning_content:
                chunk_dict["delta"]["reasoning_content"] = delta.reasoning_content[:50] + "..." if len(delta.reasoning_content) > 50 else delta.reasoning_content
        
        thinking_chunks.append(chunk_dict)
    
    print(f"共 {len(thinking_chunks)} 个 chunks")
    
    # 找出包含 reasoning_content 和 content 的 chunk
    reasoning_chunks = [c for c in thinking_chunks if c.get("delta", {}).get("reasoning_content")]
    content_chunks = [c for c in thinking_chunks if c.get("delta", {}).get("content")]
    
    print(f"\n包含 reasoning_content 的 chunks 数量: {len(reasoning_chunks)}")
    print(f"包含 content 的 chunks 数量: {len(content_chunks)}")
    
    if reasoning_chunks:
        print("\n第一个思考 chunk:")
        print(json.dumps(reasoning_chunks[0], indent=2, ensure_ascii=False))
    
    if content_chunks:
        print("\n第一个回答 chunk:")
        print(json.dumps(content_chunks[0], indent=2, ensure_ascii=False))


def main():
    print("DeepSeek API 测试开始")
    print(f"API Base URL: {BASE_URL}")
    print(f"API Key: {API_KEY[:10]}...{API_KEY[-4:]}")
    
    try:
        # 测试基础流式输出
        test_basic_stream()
        
        # 测试思考模式
        test_thinking_mode()
        
        # 测试多轮对话
        test_multi_round()
        
        # 详细测试 chunk 结构
        test_chunk_structure()
        
        print("\n" + "=" * 60)
        print("所有测试完成！")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n测试出错: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
