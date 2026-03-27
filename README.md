# DeepLink App

加密货币多 Agent 分析与交易平台 — **前端 React Native (Expo)**。

后端服务见 [deeplink-server](https://github.com/ylshie/deeplink-server)。

## 系统架构

```
React Native App ──HTTP──▸ Express Server ──API──▸ OpenAI (ChatGPT)
     │                          │                       │
  11 screens                Agent 角色定义          Tool Calling
  3 bottom tabs             Team 辩论流程               │
  pill-style tab bar        自动交易引擎          ┌─────┴─────┐
  light/dark theme          模拟交易组合          │  Market    │
                                                  │  Data      │
                                                  │  (定期抓取) │
                                                  └───────────┘
```

## 功能总览

### 三个主 Tab

| Tab | 画面 | 说明 |
|-----|------|------|
| 对话 | `ConversationsScreen` | Agent / Teams 两个 filter，列出所有可对话对象 |
| 任务 | `TasksScreen` | 排程任务卡片，运行/暂停状态实时同步 server |
| 我的 | `ProfileScreen` | 模拟交易账户、API 密钥管理、通知、语言、外观模式 |

### 完整导航流程

```
对话 tab
  ├── Agent filter → 点击 → AgentChatScreen（一对一聊天）
  └── Teams filter → 点击 → TeamChatScreen（多 Agent 辩论）
                                └── 点击 nav title → TeamDetailScreen（团队详情）

任务 tab
  ├── 点击卡片 → TaskDetailScreen（历史 / 交易 / 配置）
  ├── 卡片上 运行/暂停 按钮 → 直接启停 server 自动交易
  └── 右上角 ＋ → CreateTaskScreen（创建新任务）

我的 tab
  ├── API 密钥管理 → ApiKeysScreen（Binance 密钥增删）
  ├── 通知设置 → NotificationScreen（5 项推送开关）
  ├── 语言 → LanguageScreen（简体/繁体/English）
  └── 外观模式 → 内嵌 toggle（跟随系统/浅色/深色）
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

### 自动交易系统

任务详情页支持 server 端自动交易，不需要停留在画面上：

```
按下「测试运行」
  → POST /api/trading/auto/start
  → Server 立即执行第一轮 AI 辩论
  → 之后按配置间隔（默认 15 分钟）自动循环
  → 每轮: 多 Agent 辩论 → confidence ≥ 70% 自动执行模拟交易
  → 可随时关闭 app，server 继续运行

按下「暂停」
  → POST /api/trading/auto/stop
  → Server 停止定时循环
  → 历史记录保留
```

**Task Detail 三个 tab：**

| Tab | 内容 |
|-----|------|
| **历史** | 所有 AI 辩论结果（BUY/HOLD/SELL + confidence% + 分析摘要），有交易执行的卡片显示 footer |
| **交易** | 仅显示实际买入/卖出的记录 |
| **配置** | 交易对、间隔、金额、阈值等参数，暂停后可编辑 |

### 主题切换

支持 Light / Dark 双主题 + 跟随系统：

- **ThemeContext** + `useTheme()` hook 提供动态 colors
- 所有 11 个画面支持深色模式
- Dark 色系取自 `.pen` 设计变量（`#131124` 背景、`#5749F4` 主色）
- 选择持久化到 AsyncStorage

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

### Trading

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/trading/portfolio` | 模拟账户余额、盈亏、持仓 |
| `POST` | `/api/trading/execute` | 手动买卖（指定币种/方向/金额） |
| `POST` | `/api/trading/ai-execute` | 单次 AI 辩论 → 自动执行 |
| `GET` | `/api/trading/history` | 交易历史 |
| `GET` | `/api/trading/signals/:taskId` | 任务信号历史 |
| `POST` | `/api/trading/auto/start` | 启动 server 端自动交易 |
| `POST` | `/api/trading/auto/stop` | 暂停自动交易 |
| `GET` | `/api/trading/auto/status` | 所有自动交易任务状态 |
| `POST` | `/api/trading/auto/clear` | 清除信号和历史 |

## 项目结构

```
deeplink-app/
├── App.js                              # 入口：ThemeProvider + SafeArea + Navigation
├── metro.config.js                     # Metro 配置
├── eas.json                            # EAS Build 配置
├── src/
│   ├── api/                            # API 层（调用 deeplink-server）
│   │   ├── config.js                   #   API_BASE_URL → deeplink.gotest24.com
│   │   ├── conversations.js            #   getAgents()、getTeams()
│   │   ├── chat.js                     #   getTeamChat()、sendAgentMessage()、sendTeamMessage()
│   │   ├── tasks.js                    #   getTasks()、getTaskRuns()（本地 mock）
│   │   └── profile.js                  #   getProfile()（本地 mock）
│   ├── components/
│   │   ├── CustomTabBar.js             #   药丸形底部 Tab Bar（动态主题）
│   │   └── IconMap.js                  #   icon name → Lucide component 映射
│   ├── navigation/
│   │   └── AppNavigator.js             #   Stack + Tab 导航（11 screens）
│   ├── screens/
│   │   ├── ConversationsScreen.js      #   对话列表（Agent / Teams filter）
│   │   ├── AgentChatScreen.js          #   Agent 一对一聊天 + KeyboardAvoidingView
│   │   ├── TeamChatScreen.js           #   Team 多 Agent 辩论 + 点 title 到详情
│   │   ├── TeamDetailScreen.js         #   团队详情（成员列表 + 进入讨论）
│   │   ├── TasksScreen.js             #   任务仪表板（运行/暂停 实时同步 server）
│   │   ├── TaskDetailScreen.js         #   任务详情（历史 / 交易 / 配置 三 tab）
│   │   ├── CreateTaskScreen.js         #   创建任务（名称/群/配置/提示词/插件/模型）
│   │   ├── ProfileScreen.js            #   我的（模拟账户 + 菜单）
│   │   ├── ApiKeysScreen.js            #   Binance API 密钥管理（增删）
│   │   ├── NotificationScreen.js       #   通知设置（5 项开关）
│   │   └── LanguageScreen.js           #   语言切换（简体/繁体/English）
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
cp .env.example .env   # 填入 OPENAI_API_KEY
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

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | OpenAI API 密钥（必填） | — |
| `OPENAI_MODEL` | 模型 | `gpt-4o` |
| `PORT` | 服务端口 | `3000` |
| `LOG_TOOL` | Tool call 日志 | `0` |
| `LOG_FETCH` | Fetcher 日志 | `0` |
| `LOG_ALL` | 全部日志 | `0` |

## 设计来源

UI 设计基于 `doc/DEEPLINK.pen` 文件，支持 Light / Dark 双主题：

**Light 模式：**
- 主色: `#007AFF`（蓝）、`#34C759`（绿）
- 背景: `#FAFAFA`、卡片: `#FFFFFF`

**Dark 模式：**
- 主色: `#5749F4`（紫）、`#34C759`（绿）
- 背景: `#131124`、卡片: `#1A182E`

**通用：**
- 字体: Inter
- Tab Bar: 药丸形浮动设计，圆角 32
- 信号卡片: 圆角 16，BUY 绿底 / HOLD 灰底 / SELL 红底 + confidence%
- 交易执行 footer: 分隔线 + 交易描述 + token 数

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
