# ChatGPT 对话问答系统

基于 React + FastAPI 的类 ChatGPT 对话系统，支持多轮对话、对话历史管理，接入 DeepSeek API。

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- React Router v6
- Axios
- Zustand

### 后端
- Python 3.12+
- FastAPI
- SQLAlchemy + aiosqlite (SQLite)
- JWT 认证

### AI 服务
- DeepSeek API (支持思考过程展示)

## 快速开始

### 1. 启动后端

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 DEEPSEEK_API_KEY

# 启动服务
uvicorn app.main:app --reload --port 8000
```

后端 API 文档: http://localhost:8000/api/docs

### 2. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端地址: http://localhost:5173

### 3. 健康检查

- 后端健康检查: http://localhost:8000/api/health
- 前端健康检查页面: http://localhost:5173/health

## 项目结构

```
chatGPT/
├── frontend/                # React 前端
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API 请求封装
│   │   ├── stores/          # 状态管理
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── types/           # TypeScript 类型
│   │   └── utils/           # 工具函数
│   └── vite.config.ts
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/             # API 路由
│   │   ├── core/            # 核心配置
│   │   ├── models/          # 数据库模型
│   │   ├── schemas/         # Pydantic 模型
│   │   └── services/        # 业务逻辑
│   ├── data/                # SQLite 数据库
│   └── requirements.txt
└── README.md
```

## API 说明（Phase 4）

| 路径 | 说明 |
|------|------|
| `POST /api/chat/completions` | SSE 流式对话，`meta` → `reasoning`/`content` → `done` → `[DONE]` |
| `GET/POST/PATCH/DELETE /api/conversations` | 会话 CRUD |

请在 `backend/.env` 中配置有效 `DEEPSEEK_API_KEY`。

## 开发进度

- [x] Phase 1: 项目初始化 + 健康检查
- [x] Phase 2: 前端 UI
- [x] Phase 3: 数据库与认证
- [x] Phase 4: AI 对话核心 (DeepSeek + 会话 API + 前端流式对接)
- [x] Phase 5: 设置与对话联动（主题持久化、`model` 请求参数、思考模式与 Reasoner 区分、根目录 `.gitignore`）
- [ ] Phase 6: 联调与部署（Docker 等）
