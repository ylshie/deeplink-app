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
