# DeepLink App

加密货币多 Agent 分析与交易平台 — **前端 React Native (Expo)**。

后端服务见 [deeplink-server](https://github.com/ericyi/deeplink-server)。

## 系统架构

```
React Native App ──HTTP──▸ Express Server ──API──▸ OpenAI (ChatGPT)
     │                          │                       │
  6 screens                Agent 角色定义          Tool Calling
  3 bottom tabs            Team 辩论流程               │
  pill-style tab bar       对话存储              ┌─────┴─────┐
                                                 │  Market    │
                                                 │  Data      │
                                                 │  (定期抓取) │
                                                 └───────────┘
```

## 功能总览

### 三个主 Tab

| Tab | 画面 | 说明 |
|-----|------|------|
| 对话 | `ConversationsScreen` | Agent / Teams 两个 filter，列出所有可对话对象 |
| 任务 | `TasksScreen` | 排程任务卡片，运行/暂停/草稿状态筛选 |
| 我的 | `ProfileScreen` | 用户资料、Stats、API 密钥、模拟交易组合 |

### 导航流程

```
对话 tab
  ├── Agent filter → 点击 → AgentChatScreen（一对一聊天）
  └── Teams filter → 点击 → TeamDetailScreen（团队详情）
                                └── 进入讨论 → TeamChatScreen（多 Agent 辩论）

任务 tab → 点击卡片 → TaskDetailScreen（运行历史）
```

### 两种聊天模式

| 模式 | 画面 | 说明 |
|------|------|------|
| Agent 一对一 | `AgentChatScreen` | 单一 Agent 直接对话，Agent 自动调用相关工具获取数据 |
| Team 多 Agent 辩论 | `TeamChatScreen` | 多 Agent 并行分析（各自调用工具），主持人综合共识 |

### Team 辩论流程

```
1. 用户发送消息
2. Fan-out: 所有 Agent 并行调用 ChatGPT（各带自己的 system prompt + tools）
3. 每个 Agent 自主决定是否调用工具获取数据（可多轮 tool calling）
4. 收集所有 Agent 的最终回复
5. Moderator 综合意见 → 产出共识 JSON（action / confidence / votes）
6. 返回前端: agentMessages[] + debate card
```

## Tool Calling（类 MCP 机制）

Agent 通过 OpenAI function calling 机制调用数据工具，类似 MCP（Model Context Protocol）的 tool 调用模式。每个 Agent 只能访问与其角色相关的工具子集。

### 可用工具

| 工具 | 说明 | 数据来源 | 更新频率 |
|------|------|----------|----------|
| `get_price` | 价格、涨跌幅、成交量、市值 | `market/prices.json` | 每分钟 |
| `get_technicals` | RSI、MACD、布林带、EMA、支撑阻力位 | `market/technicals.json` | 每 5 分钟 |
| `get_onchain` | 活跃地址、交易所流向、鲸鱼交易、TVL | `market/onchain.json` | 每小时 |
| `get_sentiment` | 恐慌贪婪指数、资金费率、多空比、社群情绪 | `market/sentiment.json` | 每 15 分钟 |
| `get_macro` | Fed 利率、CPI、美股指数、ETF 流向、事件日历 | `market/macro.json` | 每小时 |
| `get_arbitrage` | 跨所价差、资金费率套利机会 | `market/arbitrage.json` | 每 30 秒 |

### Agent → 工具权限映射

| Agent | get_price | get_technicals | get_onchain | get_sentiment | get_macro | get_arbitrage |
|-------|:---------:|:--------------:|:-----------:|:-------------:|:---------:|:-------------:|
| DEEPLINK | ✓ | | | ✓ | | |
| 基本面分析 | ✓ | | ✓ | | ✓ | |
| 技术面分析 | ✓ | ✓ | | | | |
| 情绪面分析 | ✓ | | | ✓ | | |
| 宏观新闻分析 | ✓ | | | ✓ | ✓ | |
| 风控官 | ✓ | ✓ | | ✓ | | |
| 量化策略 | ✓ | ✓ | ✓ | ✓ | | |
| 套利猎手 | ✓ | | | | | ✓ |
| 链上分析 | ✓ | | ✓ | | | |
| 风控监控 | ✓ | | | ✓ | | ✓ |

### Tool Calling 流程

```
Agent 收到用户消息
  → ChatGPT 判断是否需要数据
  → 是: 返回 tool_calls（如 get_price({symbol:"BTC"})）
       → 服务端执行工具，从 JSON 文件读取数据
       → 将结果回传给 ChatGPT
       → ChatGPT 可能再次调用工具（最多 5 轮）
       → 最终给出基于真实数据的分析回复
  → 否: 直接回复
```

### 背景数据抓取（Scheduler）

服务启动时自动启动背景 scheduler，各 fetcher 以独立 `setInterval` 循环运行，互不影响：

| Fetcher | 间隔 | 数据来源 | 输出文件 |
|---------|------|----------|----------|
| `prices` | 1 分钟 | Binance CCXT (fetchTickers) | `prices.json` |
| `technicals` | 5 分钟 | Binance OHLCV 200 根 K 线 → RSI/MACD/Bollinger/EMA 计算 | `technicals.json` |
| `onchain` | 1 小时 | mempool.space + blockchain.com + Binance public | `onchain.json` |
| `sentiment` | 15 分钟 | Binance Futures (funding rate, long/short, OI) + 自算 fear/greed | `sentiment.json` |
| `macro` | 1 小时 | CoinGecko global + Binance tickers + 静态宏观数据 | `macro.json` |
| `arbitrage` | 30 秒 | Binance + OKX 跨所价差 + Binance Futures funding rate | `arbitrage.json` |

**架构参考自 [MyAlice](../MyAlice) 项目**：
- setInterval 独立定时器（参考 `multi-engine.ts` 的 tick loop）
- Promise.allSettled 容错并行抓取（参考 `chain/fetcher.ts`）
- 技术指标自算 RSI/MACD/Bollinger/EMA（参考 `indicators/calculate.ts`）
- CCXT 统一交易所接口（参考 `broker/binance-broker.ts`）

**监控**：`GET /api/health` 返回各 fetcher 的运行状态、最后执行时间、错误信息。

## Agent 角色

### 个人 Agent（Agent tab 可直接对话）

| Agent | 图标 | 职责 |
|-------|------|------|
| **DEEPLINK** | link | 平台通用助手，引导用户使用各分析功能 |
| **基本面分析 Agent** | brain | TVL、机构资金、ETF、生态评估 |
| **技术面分析 Agent** | trending-up | K 线、RSI、MACD、支撑阻力位 |
| **宏观新闻分析 Agent** | shield | Fed 利率、CPI、监管政策、地缘政治 |
| **情绪面分析 Agent** | activity | 恐慌贪婪指数、社群情绪、资金费率 |

### Team 及专属 Agent

**BTC 多维分析群** — 多维度分析与交易决策

| Agent | 职责 |
|-------|------|
| 基本面分析 | TVL、机构资金 |
| 技术面分析 | K线、RSI、MACD |
| 情绪面分析 | 恐慌指数、资金费率 |
| 风控官 | 仓位把关，可否决交易 |
| 量化策略 | 综合信号、概率化建议 |

**ETH 套利监控组** — 跨所套利机会监控与执行

| Agent | 职责 |
|-------|------|
| 套利猎手 | 跨所价差、利润预估 |
| 链上分析 | 鲸鱼动向、链上异常 |
| 风控监控 | 交易前风控检查 |

**量化策略研究群** — 策略研发、回测与优化

| Agent | 职责 |
|-------|------|
| 回测引擎 | 历史回测、夏普比率 |
| 因子分析 | 因子贡献、权重建议 |
| 执行优化 | 滑点最小化、订单策略 |
| 风控评估 | VaR、压力测试 |

## API Endpoints

### Agents

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/agents` | 列出所有个人 Agent |
| `GET` | `/api/agents/:id/messages` | 获取 Agent 聊天历史 |
| `POST` | `/api/agents/:id/chat` | 发送消息，获取 AI 回复（含 tool calling） |

### Teams

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/teams` | 列出所有分析群 |
| `GET` | `/api/teams/:id/messages` | 获取分析群聊天历史（含 agents 列表） |
| `POST` | `/api/teams/:id/chat` | 发起多 Agent 辩论（含 tool calling） |

### 请求 / 响应示例

**POST `/api/agents/:id/chat`**
```json
// Request
{ "text": "BTC 现在基本面如何？" }

// Response — Agent 自动调用了 get_price + get_onchain 后回复
{
  "userMessage": { "id": "...", "type": "user", "text": "..." },
  "agentMessage": { "id": "...", "type": "agent", "agentId": "agent-fundamental", "text": "..." }
}
```

**POST `/api/teams/:id/chat`**
```json
// Request
{ "text": "BTC 现在适合买入吗？" }

// Response — 每个 Agent 各自调用工具后回复，Moderator 综合共识
{
  "userMessage": { "id": "...", "type": "user", "text": "..." },
  "agentMessages": [
    { "id": "...", "type": "agent", "agentId": "agent-fundamental", "text": "..." },
    { "id": "...", "type": "agent", "agentId": "agent-technical", "text": "..." }
  ],
  "debate": {
    "id": "...",
    "type": "debate",
    "action": "BUY",
    "title": "BTC/USDT",
    "confidence": 82,
    "summary": "综合5位分析师观点...",
    "bullish": 4,
    "bearish": 1,
    "trade": "BUY 0.05 BTC",
    "tradePrice": "@ $84,230 (模拟)",
    "hasReport": true
  }
}
```

## 项目结构

```
deeplink-app/
├── App.js                              # 入口：SafeArea + NavigationContainer
├── src/
│   ├── api/                            # API 层（调用 deeplink-server）
│   │   ├── config.js                   #   API_BASE_URL、fetchApi()
│   │   ├── conversations.js            #   getAgents()、getTeams()
│   │   ├── chat.js                     #   getTeamChat()、sendAgentMessage()、sendTeamMessage()
│   │   ├── tasks.js                    #   getTasks()、getTaskRuns()（mock）
│   │   └── profile.js                  #   getProfile()、getApiKeys()（mock）
│   ├── components/
│   │   ├── CustomTabBar.js             #   药丸形底部 Tab Bar
│   │   └── IconMap.js                  #   icon name → Lucide component 映射
│   ├── navigation/
│   │   └── AppNavigator.js             #   Stack + Tab 导航
│   ├── screens/
│   │   ├── ConversationsScreen.js      #   对话列表（Agent / Teams filter）
│   │   ├── AgentChatScreen.js          #   Agent 一对一聊天
│   │   ├── TeamDetailScreen.js         #   团队详情（成员、快捷操作）
│   │   ├── TeamChatScreen.js           #   Team 多 Agent 辩论
│   │   ├── TasksScreen.js              #   任务仪表板
│   │   ├── TaskDetailScreen.js         #   任务运行历史
│   │   └── ProfileScreen.js            #   个人资料
│   └── theme/
│       ├── colors.js                   #   设计 tokens
│       └── index.js                    #   fonts、spacing
```

## 快速开始

### 1. 启动后端（另一个 repo）

```bash
git clone https://github.com/ericyi/deeplink-server.git
cd deeplink-server
cp .env.example .env   # 填入 OPENAI_API_KEY
npm install
npm start              # http://localhost:3000
```

### 2. 启动前端

```bash
git clone https://github.com/ericyi/deeplink-app.git
cd deeplink-app
npm install
npx expo start
```

- 按 `w` 开启 Web 预览
- 按 `i` 开启 iOS 模拟器
- 按 `a` 开启 Android 模拟器
- 用 Expo Go 扫 QR code 在真机上运行

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | OpenAI API 密钥（必填） | — |
| `OPENAI_MODEL` | 使用的模型 | `gpt-4o` |
| `PORT` | 服务端口 | `3000` |

## 设计来源

UI 设计基于 `doc/DEEPLINK.pen` 文件，采用以下设计规范：

- **主色**: `#007AFF`（蓝）、`#34C759`（绿）
- **背景**: `#FAFAFA`
- **字体**: Inter
- **Tab Bar**: 药丸形浮动设计，圆角 32
- **卡片**: 圆角 16，1px `#E5E5E5` 边框

## 切换 AI 引擎

如需切换回 Claude 或其他 LLM，只需修改 `server/services/ai.js`：

```js
// 当前: OpenAI（含 tool calling）
const OpenAI = require('openai');
const client = new OpenAI();
// 使用 client.chat.completions.create() + tools 参数

// 切换为 Anthropic Claude:
// const Anthropic = require('@anthropic-ai/sdk');
// const client = new Anthropic();
// 使用 client.messages.create() + tools 参数（Claude 也支持 tool use）
```

`debate()` 和 tool 定义/执行器无需改动 — 只需适配 `chatWithTools()` 内的 API 调用格式。
