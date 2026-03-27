# DeepLink App

加密货币多 Agent 分析与交易平台 — **前端 React Native (Expo)**。

后端服务见 [deeplink-server](https://github.com/ylshie/deeplink-server)。

## 系统架构

```
React Native App ──HTTP──▸ Express Server ──API──▸ OpenAI (ChatGPT)
     │                          │                       │
  14 screens                Agent 角色定义          Tool Calling
  3 bottom tabs             Team 辩论流程               │
  pill-style tab bar        自动交易引擎          ┌─────┴─────┐
  light/dark theme          模拟交易组合          │  Market    │
  email login               Binance 密钥管理      │  Data      │
                            Resend 邮件验证       │  (定期抓取) │
                                                  └───────────┘
```

## 功能总览

### 三个主 Tab

| Tab | 画面 | 说明 |
|-----|------|------|
| 对话 | `ConversationsScreen` | Agent / Teams 两个 filter，列出所有可对话对象，非内置可删除 |
| 任务 | `TasksScreen` | 任务卡片（运行/编辑/删除），运行中不可删除，内置不可删除 |
| 我的 | `ProfileScreen` | 模拟交易账户、API 密钥、通知、语言、外观模式、退出登录 |

### 完整导航流程

```
LoginScreen（邮箱验证码登录）
  ↓ 验证通过
对话 tab
  ├── Agent filter → 点击 → AgentChatScreen（一对一聊天）
  ├── Agent 非内置项 🗑 → 删除
  ├── Teams filter → 点击 → TeamChatScreen（多 Agent 辩论）
  │                            └── 点击 nav title → TeamDetailScreen（团队详情）
  └── Teams 非内置项 🗑 → 删除

任务 tab
  ├── 点击卡片 → TaskDetailScreen（历史 / 交易 / 配置）
  │    ├── 历史 tab → 点击卡片 → DebateDetailScreen（每个 Agent 完整意见 + 投票）
  │    ├── 交易 tab → 统计卡 + 交易列表 → 点击 → TradeDetailScreen（订单 + Agent 投票）
  │    └── 配置 tab → 暂停后可编辑参数
  ├── 卡片操作行: 运行 | 编辑 | 删除（运行中/内置不可删除）
  └── 右上角 ＋ → CreateTaskScreen（创建新任务）

我的 tab
  ├── API 密钥管理 → ApiKeysScreen（Binance 真实密钥连接 + 余额查询）
  ├── 通知设置 → NotificationScreen（5 项推送开关）
  ├── 语言 → LanguageScreen（简体/繁体/English）
  ├── 外观模式 → 内嵌 toggle（跟随系统/浅色/深色）
  └── 退出登录 → 清除 session，回到 LoginScreen
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
4. 收集所有 Agent 的最终回复，解析投票方向（看多/看空/中性）
5. Moderator 综合意见 → 产出共识 JSON（action / confidence / votes）
6. 返回前端: agentMessages[] + debate card + votes[]
```

### 自动交易系统

任务详情页支持 server 端自动交易，不需要停留在画面上：

```
按下「测试运行」
  → POST /api/trading/auto/start
  → Server 立即执行第一轮 AI 辩论
  → 之后按配置间隔（默认 15 分钟）自动循环
  → 每轮: 多 Agent 辩论 → 解析投票 → confidence ≥ 70% 自动执行模拟交易
  → 可随时关闭 app，server 继续运行

按下「暂停」
  → POST /api/trading/auto/stop
  → Server 停止定时循环
  → 历史记录保留
```

**Task Detail 三个 tab：**

| Tab | 内容 | 设计参照 |
|-----|------|----------|
| **历史** | AI 辩论结果卡片（BUY/HOLD/SELL + confidence% + 摘要 + 交易 footer），点击进入 `DebateDetailScreen` | `DL - Task Detail (Doubao)` |
| **交易** | 顶部统计卡（总盈亏/胜率/总交易） + 交易列表（badge + pair + time + PnL），点击进入 `TradeDetailScreen` | `DL - Task Detail Trade (Doubao)` |
| **配置** | 交易对、间隔、金额、阈值等参数，暂停后可编辑 | — |

**DebateDetailScreen（分析详情）：**

| 区块 | 内容 |
|------|------|
| 摘要卡 | 时间 + action badge + confidence% + 综合摘要 + 交易执行 |
| Agent 分析意见 | 每个 Agent 独立卡片：彩色 avatar + 名称 + 投票 badge（看多/看空/中性） + **完整分析意见原文** |

**TradeDetailScreen（交易详情）：**

| 区块 | 内容 | 设计参照 |
|------|------|----------|
| Overview 卡 | action badge + pair + confidence + 净盈亏/收益率/持仓时间 | `DL - Trade Detail (Doubao)` |
| 订单信息 | 买入价格、当前价格、买入数量、仓位占比、止损价格 | 同上 |
| Agent 投票明细 | 每个 Agent 的彩色 avatar + 投票结果（看多/看空/中性） | 同上 |

### 主题切换

支持 Light / Dark 双主题 + 跟随系统：

- **ThemeContext** + `useTheme()` hook 提供动态 colors
- 所有画面支持深色模式
- Dark 色系取自 `.pen` 设计变量（`#131124` 背景、`#5749F4` 主色）
- 选择持久化到 AsyncStorage

### 登录认证

邮箱验证码登录，无需密码：

```
打开 App → LoginScreen
  → 输入邮箱 → 「获取验证码」
  → Server POST /api/auth/send-code
  → Resend API 发送含 6 位验证码的邮件
  → 用户输入验证码 → 「登录」
  → Server POST /api/auth/verify → 返回 session token
  → Token 存入 AsyncStorage，30 天有效
  → 进入主 App
```

- 验证码 5 分钟内有效，60 秒冷却后可重发
- 重启 App 自动检查 session 是否有效（`POST /api/auth/check`）
- 退出登录清除 server session + 本地 token

### Binance API 密钥

真实连接 Binance 账户，密钥全程加密：

```
我的 → API 密钥管理 → 连接 Binance 账户
  → 输入 API Key + Secret Key
  → 「验证并连接」
  → Server 用 CCXT 连接 Binance fetchBalance() 验证
  → 成功: AES-256-GCM 加密密钥 → 返回 encrypted token
  → App 存 token 到 AsyncStorage（原始密钥不保留）
  → 查看余额: token 发给 server → 解密 → 实时查询 Binance
```

| 层 | 安全措施 |
|---|---|
| App 端 | 只存 encrypted token，不存原始 key |
| 传输 | HTTPS 加密传输 |
| Server 端 | 不持久化任何密钥，仅在内存中解密使用（5 分钟 cache） |
| 加密 | AES-256-GCM，key 由 `ENCRYPTION_KEY` 环境变量派生 |

### 任务管理

- 内置任务（BTC 15min Debate）不可删除
- 用户创建的任务存在 AsyncStorage，可删除
- 任务卡片操作行：运行 | 编辑 | 删除
- 运行中的任务不显示删除按钮（需先暂停）
- Agent 和 Team 同理：内置不可删除，用户创建的显示 🗑 可删除

## Tool Calling（类 MCP 机制）

Agent 通过 OpenAI function calling 机制调用数据工具，类似 MCP 的 tool 调用模式。每个 Agent 只能访问与其角色相关的工具子集。

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

## API Endpoints

### Auth

| Method | Path | 说明 |
|--------|------|------|
| `POST` | `/api/auth/send-code` | 发送 6 位验证码到邮箱（via Resend API） |
| `POST` | `/api/auth/verify` | 验证码校验，返回 session token |
| `POST` | `/api/auth/check` | 检查 session token 是否有效 |
| `POST` | `/api/auth/logout` | 注销 session |

### Credentials

| Method | Path | 说明 |
|--------|------|------|
| `POST` | `/api/credentials/validate` | 验证 Binance API 密钥，返回加密 token |
| `POST` | `/api/credentials/balance` | 用加密 token 查询真实 Binance 余额 |

### Agents

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/agents` | 列出所有 Agent（含 builtin 标记） |
| `GET` | `/api/agents/:id/messages` | Agent 聊天历史 |
| `POST` | `/api/agents/:id/chat` | 发送消息，获取 AI 回复（含 tool calling） |
| `DELETE` | `/api/agents/:id` | 删除用户创建的 Agent（内置拒绝） |

### Teams

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/teams` | 列出所有分析群（含 builtin 标记） |
| `GET` | `/api/teams/:id/messages` | 分析群聊天历史 |
| `POST` | `/api/teams/:id/chat` | 发起多 Agent 辩论（含 tool calling） |
| `DELETE` | `/api/teams/:id` | 删除用户创建的分析群（内置拒绝） |

### Trading

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/trading/portfolio` | 模拟账户余额、盈亏、持仓 |
| `POST` | `/api/trading/execute` | 手动买卖（指定币种/方向/金额） |
| `POST` | `/api/trading/ai-execute` | 单次 AI 辩论 → 自动执行 |
| `GET` | `/api/trading/history` | 交易历史 |
| `GET` | `/api/trading/signals/:taskId` | 任务信号历史（含 votes + opinions） |
| `POST` | `/api/trading/auto/start` | 启动 server 端自动交易 |
| `POST` | `/api/trading/auto/stop` | 暂停自动交易 |
| `GET` | `/api/trading/auto/status` | 所有自动交易任务状态 |
| `POST` | `/api/trading/auto/clear` | 清除信号和历史 |

## 项目结构

```
deeplink-app/
├── App.js                              # 入口：ThemeProvider + Auth gate + Navigation
├── metro.config.js                     # Metro 配置
├── eas.json                            # EAS Build 配置
├── src/
│   ├── api/                            # API 层（调用 deeplink-server）
│   │   ├── config.js                   #   API_BASE_URL → deeplink.gotest24.com
│   │   ├── conversations.js            #   getAgents/Teams + deleteAgent/Team
│   │   ├── chat.js                     #   getTeamChat/AgentChat + send messages
│   │   ├── tasks.js                    #   getTasks + addTask + deleteTask（AsyncStorage）
│   │   └── profile.js                  #   getProfile（本地 mock）
│   ├── components/
│   │   ├── CustomTabBar.js             #   药丸形底部 Tab Bar（动态主题）
│   │   └── IconMap.js                  #   icon name → Lucide component 映射
│   ├── navigation/
│   │   └── AppNavigator.js             #   Stack + Tab 导航（14 screens）
│   ├── screens/
│   │   ├── LoginScreen.js              #   邮箱验证码登录
│   │   ├── ConversationsScreen.js      #   对话列表 + 删除（非内置）
│   │   ├── AgentChatScreen.js          #   Agent 一对一聊天
│   │   ├── TeamChatScreen.js           #   Team 多 Agent 辩论
│   │   ├── TeamDetailScreen.js         #   团队详情（成员 + 进入讨论）
│   │   ├── TasksScreen.js             #   任务仪表板（运行/编辑/删除）
│   │   ├── TaskDetailScreen.js         #   任务详情（历史/交易/配置 三 tab）
│   │   ├── DebateDetailScreen.js       #   分析详情（每个 Agent 完整意见 + 投票）
│   │   ├── TradeDetailScreen.js        #   交易详情（订单信息 + Agent 投票明细）
│   │   ├── CreateTaskScreen.js         #   创建任务
│   │   ├── ProfileScreen.js            #   我的（模拟账户 + 菜单）
│   │   ├── ApiKeysScreen.js            #   Binance API 密钥管理
│   │   ├── NotificationScreen.js       #   通知设置
│   │   └── LanguageScreen.js           #   语言切换
│   └── theme/
│       ├── colors.js                   #   lightColors + darkColors
│       ├── ThemeContext.js             #   ThemeProvider + useTheme()
│       └── index.js                    #   统一导出
```

## 快速开始

### 1. 启动后端

```bash
git clone https://github.com/ylshie/deeplink-server.git
cd deeplink-server
cp .env.example .env   # 填入 OPENAI_API_KEY + RESEND_API_KEY
npm install
npm start              # http://localhost:3000
```

### 2. 启动前端（开发）

```bash
git clone https://github.com/ylshie/deeplink-app.git
cd deeplink-app
npm install
npx expo start
```

- 按 `w` 开启 Web 预览
- 按 `i` 开启 iOS 模拟器
- 按 `a` 开启 Android 模拟器
- 用 Expo Go 扫 QR code 在真机上运行

### 3. 构建 Android APK

```bash
npx expo prebuild --platform android --clean
cd android
echo "sdk.dir=$HOME/Android/Sdk" > local.properties
./gradlew assembleRelease
# APK 输出: android/app/build/outputs/apk/release/app-release.apk
```

### 环境变量（Server .env）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | OpenAI API 密钥（必填） | — |
| `OPENAI_MODEL` | 模型 | `gpt-4o` |
| `PORT` | 服务端口 | `3000` |
| `RESEND_API_KEY` | Resend 邮件 API 密钥（登录必填） | — |
| `EMAIL_FROM` | 发件人地址 | `onboarding@resend.dev` |
| `ENCRYPTION_KEY` | 密钥加密种子 | 内置默认值 |
| `LOG_TOOL` | Tool call 日志 | `0` |
| `LOG_FETCH` | Fetcher 日志 | `0` |
| `LOG_ALL` | 全部日志 | `0` |

## 设计来源

UI 设计基于 `doc/DEEPLINK.pen` 文件，支持 Light / Dark 双主题：

**Light 模式：**
- 主色: `#007AFF`（蓝）、`#34C759`（绿）
- 背景: `#FAFAFA`、卡片: `#FFFFFF`
- 信号卡片: bg `#F5F7FA`、border `#E5E8ED`

**Dark 模式：**
- 主色: `#5749F4`（紫）、`#34C759`（绿）
- 背景: `#131124`、卡片: `#1A182E`

**信号卡片设计规范（匹配 .pen H1Wjz 节点）：**
- BUY badge: bg `#E8F8EE` text `#34C759`、交易文字 `#4E6EF2`（蓝）
- HOLD badge: bg `#ECEEF4` text `#646A73`
- SELL badge: bg `#FEECEB` text `#F54A45`、交易文字 `#F54A45`（红）
- 摘要: `#646A73` 13px lineHeight 20
- Footer: border `#E5E8ED`、tokens `#8F959E`

**交易列表设计规范（匹配 .pen pQtJ7 节点）：**
- 统计卡: 总盈亏 + 胜率 + 总交易
- 交易行: [badge] | pair + time + confidence | PnL + %

**交易详情设计规范（匹配 .pen P1wjZ 节点）：**
- Overview: action + pair + confidence + PnL 三栏
- 订单信息: 买入/当前价格、数量、仓位、止损
- Agent 投票: avatar + name + vote

## 切换 AI 引擎

如需切换回 Claude 或其他 LLM，只需修改 `deeplink-server/services/ai.js`：

```js
// 当前: OpenAI（含 tool calling）
const OpenAI = require('openai');
const client = new OpenAI();

// 切换为 Anthropic Claude:
// const Anthropic = require('@anthropic-ai/sdk');
// const client = new Anthropic();
// 使用 client.messages.create() + tools 参数（Claude 也支持 tool use）
```

`debate()` 和 tool 定义/执行器无需改动 — 只需适配 `chatWithTools()` 内的 API 调用格式。
