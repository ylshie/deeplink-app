# DeepLink App — Product Specification

Version: 1.2
Date: 2026-03-28
Repositories: [deeplink-app](https://github.com/ylshie/deeplink-app) | [deeplink-server](https://github.com/ylshie/deeplink-server)

---

## 1. Product Overview

DeepLink is a multi-agent AI crypto analysis and trading platform. Multiple AI agents with specialized roles (fundamental analysis, technical analysis, sentiment, risk control, etc.) collaborate through structured debates to produce trading recommendations. The platform connects to real Binance accounts for live trading execution.

### Core Value Proposition

- **Multi-Agent Debate**: 5+ agents analyze the market from different perspectives, vote, and reach consensus
- **Automated Trading**: Server-side engine executes trades based on AI consensus (confidence threshold)
- **Real Market Data**: Background fetchers pull live data from Binance, mempool.space, CoinGecko, etc.
- **Tool Calling**: Agents autonomously call data tools (price, technicals, on-chain, sentiment) during analysis
- **Real Binance Integration**: Connects to user's Binance account for live balance and order execution

---

## 2. Screens & Navigation

### 2.1 Navigation Architecture

```
App Launch
  └── LoginScreen (email verification code)
        ↓ session token saved
      ┌─────────────────────────────────────────────┐
      │ Bottom Tab Bar (pill-style, 3 tabs)          │
      ├─────────────┬──────────────┬────────────────┤
      │  对话 (Chat) │  任务 (Tasks) │  我的 (Profile) │
      └─────────────┴──────────────┴────────────────┘
```

### 2.2 Screen Inventory (16 screens)

| # | Screen | File | Entry Point |
|---|--------|------|-------------|
| 1 | LoginScreen | `LoginScreen.js` | App launch (if no session) |
| 2 | ConversationsScreen | `ConversationsScreen.js` | Tab 1: 对话 |
| 3 | AgentChatScreen | `AgentChatScreen.js` | Tap agent in list |
| 4 | TeamChatScreen | `TeamChatScreen.js` | Tap team in list |
| 5 | TeamDetailScreen | `TeamDetailScreen.js` | Tap nav title in TeamChat |
| 6 | CreateAgentScreen | `CreateAgentScreen.js` | + button (Agent filter) |
| 7 | CreateTeamScreen | `CreateTeamScreen.js` | + button (Teams filter) |
| 8 | TasksScreen | `TasksScreen.js` | Tab 2: 任务 |
| 9 | TaskDetailScreen | `TaskDetailScreen.js` | Tap task card |
| 10 | DebateDetailScreen | `DebateDetailScreen.js` | Tap history card in TaskDetail |
| 11 | TradeDetailScreen | `TradeDetailScreen.js` | Tap trade row in TaskDetail |
| 12 | CreateTaskScreen | `CreateTaskScreen.js` | + button in Tasks header |
| 13 | ProfileScreen | `ProfileScreen.js` | Tab 3: 我的 |
| 14 | ApiKeysScreen | `ApiKeysScreen.js` | Profile > API 密钥管理 |
| 15 | NotificationScreen | `NotificationScreen.js` | Profile > 通知设置 |
| 16 | LanguageScreen | `LanguageScreen.js` | Profile > 语言 |

### 2.3 Full Navigation Flow

```
LoginScreen
  ↓ verify email code → session token

对话 tab (ConversationsScreen)
  ├── Header: 🔔 通知 | ＋ 新增 | 🔍 搜索 (40x40 round buttons)
  ├── Filter: [Agent] [Teams]
  ├── Agent filter:
  │   ├── Tap row → AgentChatScreen (1-on-1 AI chat)
  │   ├── Non-builtin: 🗑 delete button visible
  │   └── ＋ button → CreateAgentScreen
  └── Teams filter:
      ├── Tap row → TeamChatScreen (multi-agent debate)
      │               └── Tap nav title → TeamDetailScreen
      ├── Non-builtin: 🗑 delete button visible
      └── ＋ button → CreateTeamScreen

任务 tab (TasksScreen)
  ├── Header: + button → CreateTaskScreen
  ├── Filter: [全部] [运行中] [已暂停] [草稿]
  └── Task card:
      ├── Tap card body → TaskDetailScreen
      └── Action row: 运行|编辑|删除
          ├── 运行/暂停: toggle server auto-trader
          ├── 编辑: navigate to TaskDetail
          └── 删除: confirm dialog (non-builtin, not running)

TaskDetailScreen
  ├── 历史 tab: signal cards (BUY/HOLD/SELL + confidence + summary)
  │   └── Tap card → DebateDetailScreen (full agent opinions + votes)
  ├── 交易 tab: summary stats + trade rows (amount + price)
  │   └── Tap row → TradeDetailScreen (order info + agent votes)
  ├── 配置 tab: editable params (only when paused)
  └── Bottom: 测试运行 ↔ 暂停

我的 tab (ProfileScreen)
  ├── Profile card (email from session)
  ├── Portfolio card (real Binance balance)
  ├── API 密钥管理 → ApiKeysScreen
  ├── 通知设置 → NotificationScreen
  ├── 语言 → LanguageScreen (简体/繁体/English)
  ├── 外观模式: inline toggle (跟随系统/浅色/深色)
  └── 退出登录 → clear session → LoginScreen
```

---

## 3. Screen Specifications

### 3.1 LoginScreen

**Purpose**: Email verification code login (no password).

**Layout**:
- Logo: "D" in blue rounded square + "DeepLink" title + subtitle
- Email input field
- "获取验证码" button → sends 6-digit code via Resend API
- Code input (6 digits, centered, large font, auto-focus)
- "登录" button → verifies code → creates session
- "重新发送验证码" (60s cooldown)
- "使用其他邮箱" link

**Behavior**:
- Verification code expires in 5 minutes
- Session token stored in AsyncStorage, valid 30 days
- On app launch: checks session validity with server (`POST /api/auth/check`)
- On successful check: auto-restores Binance credential from server

### 3.2 ConversationsScreen

**Purpose**: List all agents and teams for chat/debate.

**Header**: Title "对话" + 3 round icon buttons (bell, plus, search)

**Filter Chips**: `[Agent]` `[Teams]` — switches data source

**Agent List** (filter = Agent):
- 5 built-in agents: DEEPLINK, 基本面分析, 技术面分析, 宏观新闻分析, 情绪面分析
- Each row: colored avatar (icon) | name + tag | subtitle | time | badge count
- Built-in items: no delete button
- User-created items: 🗑 delete button on right
- Tap → AgentChatScreen

**Teams List** (filter = Teams):
- 3 built-in teams: BTC 多维分析群, ETH 套利监控组, 量化策略研究群
- Each row: colored avatar | name + tag | subtitle | time | "N Agents" label
- Tap → TeamChatScreen

**Data Source**: `GET /api/agents` | `GET /api/teams` (includes `builtin` flag)

### 3.3 AgentChatScreen

**Purpose**: 1-on-1 conversation with a single AI agent.

**Layout**:
- Nav: back + agent name (centered) + ellipsis
- Chat area: scrollable, auto-scroll to bottom
- Agent messages: left-aligned white bubbles (rounded, top-left corner sharp)
- User messages: right-aligned blue bubbles (top-right corner sharp)
- Input bar: emoji + text input + mic + send button

**Behavior**:
- Send message → `POST /api/agents/:id/chat`
- Agent may call tools (get_price, get_technicals, etc.) before responding
- "思考中..." indicator with spinner while waiting
- KeyboardAvoidingView for input visibility

### 3.4 TeamChatScreen

**Purpose**: Multi-agent debate with consensus card.

**Layout**:
- Nav: back + team name (tappable → TeamDetail) + "N Agents ›" subtitle + ellipsis
- Chat area: agent messages with colored avatars + AI badges, user messages blue
- Debate card: green border, BUY/SELL badge, confidence bar, summary, vote counts, trade execution
- Input bar: emoji + text input + mic + plus button

**Behavior**:
- Send message → `POST /api/teams/:id/chat`
- All agents respond in parallel (each with own system prompt + tool calling)
- Moderator synthesizes consensus → debate card
- "分析师讨论中..." indicator while waiting

### 3.5 TeamDetailScreen

**Purpose**: View team members and enter discussion.

**Layout**:
- Nav: back + "团队详情" + settings
- Team avatar (large, colored) + name + "N 位 Agent · M 条消息"
- "进入讨论" blue button
- "成员 Agent" section: agent cards with avatar + name + role description + AI badge
- "快捷操作" section: "发起分析" card

### 3.6 CreateAgentScreen

**Purpose**: Create a new custom AI agent.

**Layout** (matches design `DL - Agent Create`):
- Nav: 取消 | 创建 Agent | 保存
- 名称: text input (rounded 14, grey bg)
- 系统提示词: multiline textarea (140px height)
- 插件绑定: CoinGecko / Binance / Polymarket (checkmark selection)
- 模型: GPT-4o / GPT-4o Mini / Claude Sonnet 4.5 (selector with chevron)

### 3.7 CreateTeamScreen

**Purpose**: Create a new analysis team.

**Layout**:
- Nav: 取消 | 创建分析群 | 保存
- 群名称: text input
- 描述: multiline text input
- 目标交易对: dropdown picker (BTC/ETH/SOL/BNB/XRP/DOGE /USDT)
- 成员 AGENT: selectable list with colored avatars + check circles (minimum 2)

### 3.8 TasksScreen

**Purpose**: Manage automated trading tasks.

**Header**: Title "任务" + search + green ＋ button

**Filter Chips**: `[全部]` `[运行中]` `[已暂停]` `[草稿]`

**Task Cards**:
- Status dot (green=running, grey=stopped) + task name
- Info: team name + schedule
- Action row: 运行/暂停 | 编辑 | 删除
  - 运行/暂停: toggles server auto-trader (`POST /api/trading/auto/start|stop`)
  - 运行 button color: blue (stopped) / orange (running, shows "暂停")
  - 删除: only visible for non-builtin + not running

**Built-in Task**: "BTC 15min Debate" (cannot be deleted)

**Status Sync**: Fetches `GET /api/trading/auto/status` on load + screen focus

### 3.9 TaskDetailScreen

**Purpose**: View task execution history, trades, and configuration.

**Nav**: Back + task name + status badge (● 运行中·15m / ● 已暂停)

**Three Tabs**:

#### 历史 Tab
- Signal cards matching design (`DL - Task Detail` node):
  - Header: time + action badge (BUY green / HOLD grey / SELL red) + confidence%
  - Body: analysis summary (#646A73, 13px, lineHeight 20)
  - Footer (if trade executed): trade description (#4E6EF2 blue for BUY, #F54A45 red for SELL) + token info
- Tap card → DebateDetailScreen
- Empty state: "点击下方「测试运行」开始 AI 分析"

#### 交易 Tab
- Summary card: 总交易额 / 买入数 / 卖出数
- Trade rows matching design (`DL - Task Detail Trade` node):
  - [BUY/SELL badge] | pair + "今天 10:30 · 置信度 76%" | $10.00 @$67,810
- Tap row → TradeDetailScreen
- Empty state: "尚未执行任何交易"

#### 配置 Tab
- Editable fields (only when paused):
  - 交易对, 时间框架, 单笔金额(USDT), 执行间隔(分钟), 执行阈值(confidence%), 最大持仓
- Edit button → toggle input mode → save button
- Running state: read-only + "暂停后可修改配置" hint

**Bottom Bar**:
- Stopped: `[▶ 测试运行]`
- Running: `[⏸ 暂停]`

**Auto-Trader Behavior**:
- "测试运行" → `POST /api/trading/auto/start` → server runs AI debate loop
- Server continues running even if app is closed
- App polls `GET /api/trading/auto/status/:taskId` every 10s for new signals
- On re-enter: checks if task is running, resumes polling

### 3.10 DebateDetailScreen

**Purpose**: View full agent opinions for a single debate round.

**Layout** (matches design):
- Nav: back + "分析详情"
- Summary card: time + action badge + confidence + summary text + trade line
- "Agent 分析意见" section:
  - Per-agent card: colored avatar (32px, rounded 8) + name + vote badge (看多/看空/中性) + full opinion text

**Vote Colors**: 看多 = #34C759 (green), 看空 = #F54A45 (red), 中性 = #646A73 (grey)

**Data**: Reads `signal.votes[]` with `{ agent, agentId, vote, opinion }` from server

### 3.11 TradeDetailScreen

**Purpose**: View details of a single trade execution.

**Layout** (matches design `DL - Trade Detail`):
- Nav: back + "交易详情" + share icon
- Overview card (rounded 20, grey bg):
  - Top: action badge + pair + time + confidence badge
  - Divider
  - Stats: 交易额 / 数量 / 成交价
- 订单信息 card: 交易方向, 交易对, 成交价格, 成交数量, 交易金额, 置信度
- Agent 投票明细 card: per-agent avatar + name + vote (看多/看空/中性)

### 3.12 CreateTaskScreen

**Purpose**: Create a new automated trading task.

**Layout** (matches design `DL - Task Create`):
- Nav: 取消 | 创建任务 | 保存
- 任务名称: text input
- 关联团队: dropdown picker modal (3 teams)
- 交易对: dropdown picker modal (BTC/ETH/SOL/BNB/XRP/DOGE /USDT)
- 执行频率: dropdown picker modal (5min/15min/30min/1h/4h/daily)
- 辩论轮数: counter (- / N 轮 / +), range 1-10
- 决策模式: chip selector (多数投票 / 加权投票 / 一票否决)
- 自动执行交易: switch toggle + description
- 止损保护: switch toggle + percentage input (when enabled)

**Dropdown Picker**: Bottom sheet modal with title, option list, checkmark on selected, overlay dismiss.

### 3.13 ProfileScreen

**Purpose**: User account, Binance portfolio, settings.

**Layout** (matches design `DL - Me (Doubao)`):
- Header: "我的" + settings icon
- Profile card: avatar initial + username (from email) + email
- Portfolio card:
  - Label: "Binance 交易账户" (connected) / "交易账户（未连接）"
  - Balance: real Binance total value in USD
  - Stats: USDT balance / 持仓数 / 交易数
- Menu section (rounded card with dividers):
  - 🔑 API 密钥管理 → ApiKeysScreen
  - 🔔 通知设置 → NotificationScreen
  - 🌐 语言 (value: "中文") → LanguageScreen
  - ☀️/🌙 外观模式: inline 3-button toggle (跟随系统/浅色/深色)
  - 🚪 退出登录 (red)

**Portfolio Data**: `GET /api/trading/portfolio` → real Binance balance

### 3.14 ApiKeysScreen

**Purpose**: Connect/disconnect Binance API keys.

**States**:

1. **No key saved**: "连接 Binance 账户" dashed button
2. **Adding**: Form with API Key + Secret Key (show/hide toggle) + "验证并连接" button
3. **Connected**: Card showing 🔶 Binance + masked key + ✓已连接 badge
   - "查看余额" button → fetches real balance via server
   - "断开连接" button → removes token from server + local

**Security Flow**:
1. User enters API Key + Secret
2. `POST /api/credentials/validate` → server tests connection to Binance
3. Success: server encrypts credentials (AES-256-GCM) → returns token
4. Token saved to AsyncStorage (local) + server user data (per-account)
5. Server uses token for all trading operations

**Security Hints**: Displayed at bottom explaining encryption, no raw key storage, recommendation for read-only + spot trading permissions.

### 3.15 NotificationScreen

**Purpose**: Toggle notification preferences.

**5 Settings** (switch toggles):
| Setting | Description | Default |
|---------|-------------|---------|
| 交易执行通知 | 买入/卖出执行后推送 | ON |
| 分析信号通知 | 每次 AI 分析完成后推送 | ON |
| 风控预警 | 触发止损或异常时推送 | ON |
| 价格提醒 | 到达设定价格时推送 | OFF |
| 每日报告 | 每日 22:00 推送交易总结 | OFF |

### 3.16 LanguageScreen

**Purpose**: Select display language.

**Options**: 简体中文 (default) / 繁體中文 / English

**Selection**: Tap row → checkmark on selected

---

## 4. Backend Services

### 4.1 Service Architecture

```
Express Server (Node.js)
  ├── routes/
  │   ├── auth.js         — email verification login
  │   ├── credentials.js  — Binance API key validation + encryption
  │   ├── user.js         — per-user data (tasks, settings, binance token)
  │   ├── agents.js       — agent list + 1-on-1 chat
  │   ├── teams.js        — team list + multi-agent debate
  │   └── trading.js      — portfolio, trades, auto-trader control
  ├── services/
  │   ├── auth.js         — verification codes + session management
  │   ├── email.js        — Resend API email delivery
  │   ├── userdata.js     — per-user persistent store (users.json)
  │   ├── ai.js           — ChatGPT + tool calling + debate orchestration
  │   ├── autotrader.js   — server-side setInterval auto-trading engine
  │   ├── portfolio.js    — real Binance trading via CCXT
  │   ├── broker.js       — authenticated CCXT instance management
  │   └── conversations.js — in-memory chat history
  ├── tools/
  │   ├── definitions.js  — OpenAI function schemas (6 tools)
  │   └── executor.js     — tool execution (reads market data files)
  ├── fetchers/
  │   ├── scheduler.js    — background data fetcher orchestrator
  │   ├── prices.js       — Binance spot prices (every 1 min)
  │   ├── technicals.js   — RSI/MACD/Bollinger/EMA calculation (every 5 min)
  │   ├── onchain.js      — mempool.space + blockchain.com (every 1 hr)
  │   ├── sentiment.js    — funding rates + fear/greed (every 15 min)
  │   ├── macro.js        — CoinGecko + macro data (every 1 hr)
  │   └── arbitrage.js    — cross-exchange spread scan (every 30 sec)
  └── lib/
      ├── crypto.js       — AES-256-GCM encrypt/decrypt
      └── logger.js       — toggleable logging (LOG_TOOL, LOG_FETCH)
```

### 4.2 API Endpoints

#### Authentication

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/send-code` | Send 6-digit verification code to email (via Resend) |
| `POST` | `/api/auth/verify` | Verify code → return session token (30 day TTL) |
| `POST` | `/api/auth/check` | Validate session token + restore user's Binance token |
| `POST` | `/api/auth/logout` | Invalidate session |

#### User Data (requires `x-session-token` header)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/user/tasks` | Get user's tasks (builtin + custom) |
| `POST` | `/api/user/tasks` | Create custom task |
| `DELETE` | `/api/user/tasks/:id` | Delete custom task (builtin rejected) |
| `GET` | `/api/user/settings` | Get user settings (theme, language, notifications) |
| `PUT` | `/api/user/settings` | Update user settings |
| `POST` | `/api/user/binance/connect` | Store Binance credential token |
| `POST` | `/api/user/binance/disconnect` | Remove Binance credential token |

#### Credentials

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/credentials/validate` | Test Binance API key → return encrypted token |
| `POST` | `/api/credentials/balance` | Fetch real Binance balance with encrypted token |
| `POST` | `/api/credentials/connect` | Restore credential token on server |

#### Agents

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/agents` | List all agents (includes `builtin` flag) |
| `GET` | `/api/agents/:id/messages` | Get agent chat history |
| `POST` | `/api/agents/:id/chat` | Send message → AI response (with tool calling) |
| `DELETE` | `/api/agents/:id` | Delete user-created agent |

#### Teams

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/teams` | List all teams (includes `builtin` flag) |
| `GET` | `/api/teams/:id/messages` | Get team chat history (with agents list + context) |
| `POST` | `/api/teams/:id/chat` | Multi-agent debate |
| `DELETE` | `/api/teams/:id` | Delete user-created team |

#### Trading

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/trading/portfolio` | Real Binance balance + positions |
| `POST` | `/api/trading/execute` | Manual trade (real Binance market order) |
| `POST` | `/api/trading/ai-execute` | Single AI debate → optional auto-execute |
| `GET` | `/api/trading/history` | Trade history |
| `GET` | `/api/trading/signals/:taskId` | Signal history for a task |
| `POST` | `/api/trading/auto/start` | Start server-side auto-trading |
| `POST` | `/api/trading/auto/stop` | Stop auto-trading |
| `GET` | `/api/trading/auto/status` | All auto-trader task statuses |
| `GET` | `/api/trading/auto/status/:taskId` | Single task status + signals |
| `POST` | `/api/trading/auto/clear` | Clear signals and history |

#### System

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Server health + fetcher statuses |

### 4.3 AI Agent System

#### Built-in Agents (5 individual)

| Agent | Icon | Color | Tools | Role |
|-------|------|-------|-------|------|
| DEEPLINK | link | #007AFF | price, sentiment | Platform assistant |
| 基本面分析 Agent | brain | #5856D6 | price, onchain, macro | Fundamental analysis |
| 技术面分析 Agent | trending-up | #FF3B30 | price, technicals | Technical analysis |
| 宏观新闻分析 Agent | shield | #FF3B30 | price, macro, sentiment | Macro/news analysis |
| 情绪面分析 Agent | activity | #AF52DE | price, sentiment | Sentiment analysis |

#### Built-in Teams (3 groups)

**BTC 多维分析群** (5 agents): 基本面 + 技术面 + 情绪面 + 风控官 + 量化策略
Context: BTC/USDT, 15min short-term + daily trend, max 0.1 BTC per trade, 3% stop-loss

**ETH 套利监控组** (3 agents): 套利猎手 + 链上分析 + 风控监控
Context: ETH/USDT, real-time arbitrage, 5 ETH max, 0.3% min spread, gas < 30 gwei

**量化策略研究群** (4 agents): 回测引擎 + 因子分析 + 执行优化 + 风控评估
Context: BTC+ETH, strategy R&D, Sharpe > 1.5, max drawdown < 15%

#### Tool Calling (MCP-like)

6 tools available via OpenAI function calling:

| Tool | Description | Data Source | Update Frequency |
|------|-------------|-------------|------------------|
| `get_price` | Price, 24h change, volume, market cap | Binance CCXT | Every 1 min |
| `get_technicals` | RSI(14), MACD(12,26,9), Bollinger(20,2), EMA(20/50/200) | Calculated from OHLCV | Every 5 min |
| `get_onchain` | Active addresses, mempool, hash rate, fees | mempool.space + blockchain.com | Every 1 hr |
| `get_sentiment` | Fear/Greed index, funding rates, long/short, OI | Binance Futures | Every 15 min |
| `get_macro` | Fed rate, CPI, stock indices, BTC dominance | CoinGecko + static | Every 1 hr |
| `get_arbitrage` | Cross-exchange spreads, funding rate arb | Binance + OKX | Every 30 sec |

Each agent only has access to tools relevant to its role (permission matrix in README).

#### Debate Flow

```
1. User sends message (or auto-trader triggers)
2. Team context injected (target pair, constraints, objectives)
3. Fan-out: all agents called in parallel (each with system prompt + tools)
4. Each agent may call tools multiple times (max 5 rounds)
5. Agent responses collected, votes parsed (看多/看空/中性 from keywords)
6. Moderator receives all opinions → produces consensus JSON
7. Result: { action, confidence, summary, bullish, bearish, trade, votes[] }
8. If auto-execute enabled && confidence >= 70% && action is BUY/SELL:
   → execute real market order on Binance via CCXT
```

#### Vote Parsing

Agent response text is analyzed for keywords:
- **看多**: bullish, 买入, 看多, 偏多, 建议买
- **看空**: bearish, 卖出, 看空, 偏空, 回调
- **中性**: hold, 观望, 中性, 等待

---

## 5. Data Architecture

### 5.1 Per-User Data (server-side, `data/users.json`)

All user-specific data is stored on the server, keyed by email:

```json
{
  "user@email.com": {
    "tasks": [{ "id", "name", "teamId", "pair", ... }],
    "settings": {
      "theme": "system|light|dark",
      "language": "zh-CN|zh-TW|en",
      "notifications": { "tradeExec": true, ... }
    },
    "binanceToken": "encrypted-aes-256-gcm-token"
  }
}
```

Logging in on a different device sees identical data.

### 5.2 Market Data (server-side, `data/market/*.json`)

6 JSON files updated by background fetchers. Read by tool executor when agents call tools.

### 5.3 Client-Side Storage (AsyncStorage)

| Key | Content | Purpose |
|-----|---------|---------|
| `@deeplink_session` | `{ token, email }` | Session for API auth |
| `@deeplink_binance_credentials` | `{ displayKey, token, connected }` | Binance credential display |
| `@deeplink_theme_mode` | `system\|light\|dark` | Local theme fallback |

---

## 6. Security

### 6.1 Authentication

- Email verification code login (no passwords)
- Session tokens: 32-byte random hex, 30-day TTL
- All `/api/user/*` endpoints require `x-session-token` header

### 6.2 Binance Credential Protection

| Layer | Measure |
|-------|---------|
| Client | Only stores encrypted token, never raw API key |
| Transport | HTTPS |
| Server | AES-256-GCM encryption, key derived from `ENCRYPTION_KEY` env var via scrypt |
| Runtime | Decrypted only in memory, 5-minute broker cache, never written to disk in plaintext |
| Persistence | Encrypted token stored in `users.json` per user |

### 6.3 Email Delivery

- Resend API (REST, no SMTP ports needed)
- Verification codes: 6-digit, 5-minute expiry

---

## 7. Design System

Based on `doc/DEEPLINK.pen` design file, supporting Light and Dark themes.

### 7.1 Colors

| Token | Light | Dark |
|-------|-------|------|
| Primary | #007AFF | #5749F4 |
| Background | #FAFAFA | #131124 |
| Card | #FFFFFF | #1A182E |
| Card Border | #E5E5E5 | #2B283D |
| Text Primary | #1A1A1A | #E8E8EA |
| Text Secondary | #888888 | #888799 |
| Green (BUY) | #34C759 | #34C759 |
| Red (SELL) | #F54A45 | #F54A45 |

### 7.2 Signal Card Colors (from .pen H1Wjz node)

| Action | Badge BG | Badge Text | Trade Text |
|--------|----------|------------|------------|
| BUY | #E8F8EE | #34C759 | #4E6EF2 (blue) |
| HOLD | #ECEEF4 | #646A73 | — |
| SELL | #FEECEB | #F54A45 | #F54A45 (red) |

### 7.3 Components

- **Tab Bar**: Pill-style, 62px height, rounded 32, shadow
- **Signal Cards**: Rounded 16, bg #F5F7FA, border #E5E8ED
- **Icon Buttons**: 40x40, rounded 20, grey bg + border (header actions)
- **Dropdown Picker**: Bottom sheet modal with overlay, option list + checkmark
- **Form Inputs**: Rounded 14, bg #F5F7FA, border #E5E8ED, 48px height

---

## 8. Environment Configuration

### Server `.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o` | Model for AI agents |
| `PORT` | No | `3000` | Server port |
| `RESEND_API_KEY` | Yes | — | Resend email API key |
| `EMAIL_FROM` | No | `onboarding@resend.dev` | Sender address |
| `ENCRYPTION_KEY` | No | built-in default | AES key derivation seed |
| `LOG_TOOL` | No | `0` | Enable tool call logs |
| `LOG_FETCH` | No | `0` | Enable fetcher logs |
| `LOG_ALL` | No | `0` | Enable all logs |

### Frontend

| Config | Value |
|--------|-------|
| `API_BASE_URL` | `https://deeplink.gotest24.com/api` |
| Android Package | `com.deeplink.app` |

---

## 9. Build & Deploy

### Android APK

```bash
npx expo prebuild --platform android --clean
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
cd android && ./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Server

```bash
cd deeplink-server
cp .env.example .env  # configure keys
npm install
npm start             # or: pm2 start index.js --name deeplink-server
```

Server startup sequence:
1. Load `data/users.json` (user data)
2. Restore first found Binance token to portfolio service
3. Start 6 background data fetchers
4. Listen on configured port

---

## Appendix A: Built-in Agent Definitions

### A.1 Individual Agents (available in Agent tab for 1-on-1 chat)

#### DEEPLINK (`agent-deeplink`)

| Property | Value |
|----------|-------|
| Icon | link |
| Color | #007AFF |
| Tools | get_price, get_sentiment |

**System Prompt:**
> 你是 DeepLink 智能助手。DeepLink 是一个加密货币多 Agent 分析与交易平台。你的职责是：
> - 帮助用户了解平台功能（多维分析群、AI Agent、模拟交易）
> - 解答加密货币相关的一般性问题
> - 引导用户使用合适的分析 Agent 或分析群
> - 提供平台使用建议
>
> 回复风格：友善专业，像一位经验丰富的助手。简洁清晰，2-3 句话。使用中文回复。

---

#### 基本面分析 Agent (`agent-fundamental`)

| Property | Value |
|----------|-------|
| Icon | brain |
| Color | #5856D6 |
| Tools | get_price, get_onchain, get_macro |

**System Prompt:**
> 你是 DeepLink 的基本面分析师。你的职责是：
> - 分析加密货币的链上数据（TVL、活跃地址、开发者活动）
> - 追踪机构资金流向（ETF 流入流出、灰度持仓、大户钱包动向）
> - 评估项目基本面（团队、路线图、合作伙伴、生态发展）
> - 关注宏观经济对加密市场的影响
>
> 回复风格：用数据说话，引用具体数字。给出清晰的评级（Bullish/Bearish/Neutral）和信心百分比。简洁专业，每次回复控制在 2-4 句话。使用中文回复。

---

#### 技术面分析 Agent (`agent-technical`)

| Property | Value |
|----------|-------|
| Icon | trending-up |
| Color | #FF3B30 |
| Tools | get_price, get_technicals |

**System Prompt:**
> 你是 DeepLink 的技术面分析师。你的职责是：
> - 分析 K 线形态、支撑/阻力位
> - 计算并解读技术指标（RSI、MACD、布林带、KDJ、成交量）
> - 识别图表模式（头肩顶、三角形、旗形等）
> - 提供具体的进场/出场价位建议
>
> 回复风格：列出关键技术指标数值。给出明确的方向判断和目标价。标注止损位和风险回报比。简洁专业，控制在 2-4 句话。使用中文回复。

---

#### 情绪面分析 Agent (`agent-sentiment`)

| Property | Value |
|----------|-------|
| Icon | activity |
| Color | #AF52DE |
| Tools | get_price, get_sentiment |

**System Prompt:**
> 你是 DeepLink 的市场情绪分析师。你的职责是：
> - 追踪恐慌贪婪指数（Fear & Greed Index）
> - 分析社交媒体情绪（Twitter/X、Reddit、Telegram 社群）
> - 监控资金费率和多空比
> - 评估散户 vs 机构的情绪差异
>
> 回复风格：量化情绪指标（分数、百分比）。对比历史同期情绪。判断当前处于情绪周期的哪个阶段。简洁，2-3 句话。使用中文回复。

---

#### 宏观新闻分析 Agent (`agent-macro`)

| Property | Value |
|----------|-------|
| Icon | shield |
| Color | #FF3B30 |
| Tools | get_price, get_macro, get_sentiment |

**System Prompt:**
> 你是 DeepLink 的宏观经济与新闻分析师。你的职责是：
> - 追踪 Fed 利率决策、CPI、非农等重要经济数据
> - 分析地缘政治事件对加密市场的影响
> - 监控监管政策变化（SEC、各国立法）
> - 评估传统金融市场（美股、美债、美元指数）对币圈的传导效应
>
> 回复风格：区分短期冲击 vs 长期影响。给出风险等级评估。提出应对建议。简洁，2-3 句话。使用中文回复。

---

### A.2 Team-only Agents (used within analysis groups, not available for 1-on-1)

#### 风控官 (`risk-officer`)

| Property | Value |
|----------|-------|
| Icon | shield |
| Color | #007AFF |
| Teams | BTC 多维分析群 |
| Tools | get_price, get_technicals, get_sentiment |

**System Prompt:**
> 你是 DeepLink 的首席风控官。你的职责是：
> - 评估当前持仓的风险敞口
> - 监控杠杆率、保证金比例、清算价格
> - 在其他分析师给出建议后，从风险角度把关
> - 设定仓位上限和止损纪律
>
> 回复风格：永远关注风险而非收益。给出具体的仓位建议（占总资金百分比）。在风险过高时果断否决。简洁严谨，2-3 句话。使用中文回复。

---

#### 量化策略 (`quant-strategy`)

| Property | Value |
|----------|-------|
| Icon | bar-chart-3 |
| Color | #34C759 |
| Teams | BTC 多维分析群 |
| Tools | get_price, get_technicals, get_sentiment, get_onchain |

**System Prompt:**
> 你是 DeepLink 的量化策略师。你的职责是：
> - 基于多个分析维度的数据，计算综合信号
> - 运用统计模型给出概率化的交易建议
> - 优化进出场时机和仓位大小
> - 计算预期收益和最大回撤
>
> 回复风格：数据驱动，给出具体概率和数值。综合其他分析师的观点形成量化信号。简洁精确，2-3 句话。使用中文回复。

---

#### 套利猎手 (`arb-hunter`)

| Property | Value |
|----------|-------|
| Icon | gem |
| Color | #30B0C7 |
| Teams | ETH 套利监控组 |
| Tools | get_price, get_arbitrage |

**System Prompt:**
> 你是 DeepLink 的套利机会猎手。你的职责是：
> - 监控跨交易所价差（CEX-CEX、CEX-DEX）
> - 识别期现套利、资金费率套利机会
> - 评估套利窗口持续时间和预期利润
> - 计算 gas 费用和滑点成本
>
> 回复风格：报告具体价差数字和交易所名称。给出预估利润（扣除成本后）。评估时间窗口紧迫程度。简洁直接，2-3 句话。使用中文回复。

---

#### 链上分析 (`onchain-analyst`)

| Property | Value |
|----------|-------|
| Icon | activity |
| Color | #AF52DE |
| Teams | ETH 套利监控组 |
| Tools | get_price, get_onchain |

**System Prompt:**
> 你是 DeepLink 的链上数据分析师。你的职责是：
> - 追踪大户钱包动向（鲸鱼买卖、交易所流入流出）
> - 分析 DeFi 协议的 TVL 变化和资金流向
> - 监控链上 gas 费用和网络拥堵情况
> - 解读智能合约交互数据
>
> 回复风格：引用具体链上数据和地址标签。区分正常活动和异常信号。简洁，2-3 句话。使用中文回复。

---

#### 风控监控 (`risk-monitor`)

| Property | Value |
|----------|-------|
| Icon | shield |
| Color | #FF3B30 |
| Teams | ETH 套利监控组 |
| Tools | get_price, get_arbitrage, get_sentiment |

**System Prompt:**
> 你是 DeepLink 的实时风控监控。你的职责是：
> - 检查交易执行前的风控条件（余额、限额、网络状态）
> - 评估对手方风险和交易所安全性
> - 监控异常市场波动并发出预警
> - 确保每笔交易符合风控规则
>
> 回复风格：给出明确的通过/不通过判断。列出检查项目和状态。在发现风险时立即报警。简洁，2-3 句话。使用中文回复。

---

#### 回测引擎 (`backtest-engine`)

| Property | Value |
|----------|-------|
| Icon | bar-chart-3 |
| Color | #FF9500 |
| Teams | 量化策略研究群 |
| Tools | get_price, get_technicals |

**System Prompt:**
> 你是 DeepLink 的回测分析引擎。你的职责是：
> - 对交易策略进行历史回测
> - 计算关键绩效指标（夏普比率、最大回撤、年化收益、胜率）
> - 分析策略在不同市场环境下的表现
> - 识别策略的优势和弱点
>
> 回复风格：报告具体的回测数据。对比基准（Buy & Hold、同期大盘）。给出策略改进建议。简洁专业，2-3 句话。使用中文回复。

---

#### 因子分析 (`factor-analyst`)

| Property | Value |
|----------|-------|
| Icon | brain |
| Color | #5856D6 |
| Teams | 量化策略研究群 |
| Tools | get_price, get_technicals, get_onchain |

**System Prompt:**
> 你是 DeepLink 的因子分析师。你的职责是：
> - 分解策略收益的因子贡献（动量、均值回归、波动率等）
> - 评估因子间的相关性和分散化效果
> - 监控因子暴露度的变化
> - 建议因子权重调整
>
> 回复风格：量化各因子的贡献百分比。分析因子的当前有效性。给出具体的权重调整建议。简洁，2-3 句话。使用中文回复。

---

#### 执行优化 (`exec-optimizer`)

| Property | Value |
|----------|-------|
| Icon | trending-up |
| Color | #34C759 |
| Teams | 量化策略研究群 |
| Tools | get_price, get_arbitrage |

**System Prompt:**
> 你是 DeepLink 的交易执行优化师。你的职责是：
> - 优化订单执行策略（TWAP、VWAP、冰山单）
> - 最小化滑点和市场冲击
> - 选择最优交易所和交易对
> - 监控执行质量并持续改进
>
> 回复风格：给出具体的执行方案。预估节省的成本。简洁，2-3 句话。使用中文回复。

---

#### 风控评估 (`risk-assessor`)

| Property | Value |
|----------|-------|
| Icon | shield |
| Color | #FF3B30 |
| Teams | 量化策略研究群 |
| Tools | get_price, get_technicals, get_sentiment |

**System Prompt:**
> 你是 DeepLink 的风险评估师。你的职责是：
> - 计算 VaR（Value at Risk）和 CVaR
> - 进行压力测试和情景分析
> - 评估尾部风险和黑天鹅事件影响
> - 审核策略的风险调整后收益
>
> 回复风格：报告具体的风险数值。对比风险阈值。给出通过/需关注/否决的评级。简洁严谨，2-3 句话。使用中文回复。

---

## Appendix B: Built-in Team Definitions

### B.1 BTC 多维分析群 (`team-btc`)

| Property | Value |
|----------|-------|
| Description | BTC 多维度分析与交易决策 |
| Agents | 基本面分析, 技术面分析, 情绪面分析, 风控官, 量化策略 (5) |

**Context (injected into all agents):**

| Field | Value |
|-------|-------|
| Symbol | BTC |
| Pair | BTC/USDT |
| Objective | 对 BTC/USDT 进行多维度分析，形成交易决策（买入/卖出/持有） |
| Timeframe | 15 分钟级别短线分析 + 日线级别趋势参考 |
| Constraints | 单笔上限 0.1 BTC · 当前持仓 0 BTC · 单笔最大亏损 3% · 总仓位 ≤ 30% |

**Moderator Consensus Format:**
```json
{
  "action": "BUY | SELL | HOLD",
  "title": "BTC/USDT",
  "confidence": 0-100,
  "summary": "一句话总结",
  "bullish": N,
  "bearish": N,
  "trade": "建议交易描述",
  "tradePrice": "价格信息"
}
```

---

### B.2 ETH 套利监控组 (`team-eth-arb`)

| Property | Value |
|----------|-------|
| Description | ETH 跨所套利机会监控与执行 |
| Agents | 套利猎手, 链上分析, 风控监控 (3) |

**Context:**

| Field | Value |
|-------|-------|
| Symbol | ETH |
| Pair | ETH/USDT |
| Objective | 监控 ETH 跨交易所价差和资金费率套利机会，评估后快速执行 |
| Timeframe | 实时监控，套利窗口通常持续 1-5 分钟 |
| Constraints | 支持交易所 Binance + OKX · 单笔 ≤ 5 ETH · 最低价差 0.3% · gas < 30 gwei |

**Moderator Consensus Format:**
```json
{
  "action": "EXECUTE | SKIP | WAIT",
  "title": "ETH 套利",
  "confidence": 0-100,
  "summary": "一句话总结",
  "bullish": N,
  "bearish": N,
  "trade": "执行描述",
  "tradePrice": "预期收益"
}
```

---

### B.3 量化策略研究群 (`team-quant`)

| Property | Value |
|----------|-------|
| Description | 量化策略研发、回测与优化 |
| Agents | 回测引擎, 因子分析, 执行优化, 风控评估 (4) |

**Context:**

| Field | Value |
|-------|-------|
| Symbol | BTC, ETH |
| Pair | BTC/USDT, ETH/USDT |
| Objective | 研发、回测、优化量化交易策略，评估策略可行性后部署 |
| Timeframe | 4 小时级别策略，每日再平衡 |
| Constraints | 动量 + 均值回归混合 · 回测 6 个月 · 夏普 > 1.5 · 回撤 < 15% · 压力测试 8/10 |

**Moderator Consensus Format:**
```json
{
  "action": "DEPLOY | OPTIMIZE | REJECT",
  "title": "策略评估",
  "confidence": 0-100,
  "summary": "一句话总结",
  "bullish": N,
  "bearish": N,
  "trade": "策略建议",
  "tradePrice": "预期表现"
}
```

---

## Appendix C: Tool Permission Matrix

Each agent can only access tools relevant to its role:

| Agent ID | get_price | get_technicals | get_onchain | get_sentiment | get_macro | get_arbitrage |
|----------|:---------:|:--------------:|:-----------:|:-------------:|:---------:|:-------------:|
| agent-deeplink | ✓ | | | ✓ | | |
| agent-fundamental | ✓ | | ✓ | | ✓ | |
| agent-technical | ✓ | ✓ | | | | |
| agent-sentiment | ✓ | | | ✓ | | |
| agent-macro | ✓ | | | ✓ | ✓ | |
| risk-officer | ✓ | ✓ | | ✓ | | |
| quant-strategy | ✓ | ✓ | ✓ | ✓ | | |
| arb-hunter | ✓ | | | | | ✓ |
| onchain-analyst | ✓ | | ✓ | | | |
| risk-monitor | ✓ | | | ✓ | | ✓ |
| backtest-engine | ✓ | ✓ | | | | |
| factor-analyst | ✓ | ✓ | ✓ | | | |
| exec-optimizer | ✓ | | | | | ✓ |
| risk-assessor | ✓ | ✓ | | ✓ | | |
