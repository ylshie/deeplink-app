# DeepLink App

加密货币多 Agent 分析与交易平台 — **前端 React Native (Expo)**。

后端服务见 [deeplink-server](https://github.com/ylshie/deeplink-server)。

## 系统架构

```
React Native App ──HTTP──▸ Express Server ──API──▸ OpenAI (GPT-4o-mini)
     │                          │                       │
  16 screens                Agent 角色定义          Tool Calling
  3 bottom tabs             Team 辩论流程               │
  pill-style tab bar        自动交易引擎          ┌─────┴─────┐
  light/dark theme          真实 Binance 交易      │  Market    │
  i18n (3 languages)        Resend 邮件验证       │  Data      │
  push notifications        AI 用量追踪           │  (定期抓取) │
  email login               Admin Dashboard       └───────────┘
```

## 功能总览

### 三个主 Tab

| Tab | 画面 | 说明 |
|-----|------|------|
| 对话 | `ConversationsScreen` | Agent / Teams 两个 filter，圆形按钮（通知/新增/搜索） |
| 任务 | `TasksScreen` | 任务卡片（运行/编辑/删除），运行中不可删除 |
| 我的 | `ProfileScreen` | 真实 Binance 账户余额、API 密钥、通知、语言、外观 |

### 完整导航流程

```
LoginScreen（邮箱验证码登录）
  ↓ 验证通过 + 注册推送通知
对话 tab
  ├── 🔔 通知 | ＋ 新增 | 🔍 搜索 (40x40 圆形按钮)
  ├── Agent filter:
  │   ├── Tap row → AgentChatScreen（一对一聊天）
  │   ├── ＋ → CreateAgentScreen（名称/提示词/插件/模型）
  │   └── 非内置: 🗑 删除
  └── Teams filter:
      ├── Tap row → TeamChatScreen → nav title → TeamDetailScreen
      ├── ＋ → CreateTeamScreen（名称/描述/交易对下拉/成员选择）
      └── 非内置: 🗑 删除

任务 tab
  ├── ＋ → CreateTaskScreen（名称/团队下拉/交易对下拉/频率下拉/轮数/模式/自动执行/止损）
  ├── 卡片操作行: 运行|编辑|删除
  └── Tap → TaskDetailScreen
       ├── 历史 tab → Tap → DebateDetailScreen（Agent 完整意见 + 投票）
       ├── 交易 tab → Tap → TradeDetailScreen（订单 + Agent 投票）
       └── 配置 tab（暂停可编辑）

我的 tab
  ├── Binance 交易账户（真实余额 USDT/持仓/交易数）
  ├── API 密钥管理 → ApiKeysScreen（验证/连接/查看余额/断开）
  ├── 通知设置 → NotificationScreen（5 项开关，同步 server）
  ├── 语言 → LanguageScreen（简体/繁体/English，即时切换）
  ├── 外观模式（跟随系统/浅色/深色）
  └── 退出登录
```

### i18n 多语言

三种语言，~130 个翻译 key，切换即时生效：
- 简体中文 (`zh-CN`) — 默认
- 繁體中文 (`zh-TW`)
- English (`en`)

使用方式：`const { t } = useI18n()` → `t('profile_title')` → "我的" / "我的" / "Profile"

语言设置同步到 server（跨设备一致）+ 本地 AsyncStorage fallback。

### 推送通知

- `expo-notifications` + `expo-device` 集成
- 登录后自动请求通知权限 + 注册 push token
- Android 通知频道配置（震动 + 声音）
- 5 项通知开关（交易执行/分析信号/风控预警/价格提醒/每日报告）
- 设置同步到 server

### 真实 Binance 交易

- 连接真实 Binance API Key（AES-256-GCM 加密）
- 余额从 Binance 实时拉取（USDT + 各币种持仓）
- 自动交易下真实市价单（默认 10 USDT/笔）
- 持仓感知：已持仓时不重复买入，无持仓时不卖出
- 查看 Binance 真实成交记录：`GET /api/trading/orders/:symbol`

### 自动交易引擎

Server 端运行，不需停留在画面：

```
测试运行 → POST /api/trading/auto/start
  → 每 15 分钟: 查持仓 → 注入持仓信息到 AI prompt
  → 多 Agent 辩论（各自 tool calling 读取即时市场数据）
  → confidence ≥ 70% + action=BUY/SELL → 执行真实交易
  → 信号持久化到 data/signals.json（重启不丢失）
  → 最多保留 500 条历史
```

防护规则：
| 情况 | 行为 |
|---|---|
| BUY 但已持仓 > quoteAmount | 跳过买入 |
| SELL 但无持仓 | 跳过卖出 |
| HOLD（不论 confidence） | 不执行交易 |

### AI 用量追踪 + Admin Dashboard

每次 AI API 调用记录：model、input/output tokens、cost、agent、team、user

**Admin Dashboard**: `https://deeplink.gotest24.com/admin`

| 区块 | 内容 |
|------|------|
| 摘要卡片 | 总调用数 / Input Tokens / Output Tokens / 总费用 + 月度预估 |
| Per Agent | 各 Agent 调用次数、tokens、费用排行 |
| Per Day | 每日调用量和费用趋势 |
| Recent Calls | 最近 100 次调用：时间、类型标签、Agent、tokens、费用 |

支持按天数（1/7/30/90）和用户 email 筛选。

### 数据持久化

| 数据 | 存储位置 | 说明 |
|------|----------|------|
| 用户任务/设置/密钥 | Server `data/users.json` | 跨设备同步 |
| 自动交易信号 | Server `data/signals.json` | 重启不丢失，最多 500 条 |
| AI 用量日志 | Server `data/ai-usage.json` | 最多 5000 条 |
| 市场数据 | Server `data/market/*.json` | 6 个 fetcher 定时更新 |
| Session token | App AsyncStorage | 30 天有效 |
| Binance 加密 token | App + Server | 双重存储 |
| 主题/语言 | App + Server | 本地即时 + server 同步 |

### 性能优化

| 优化项 | 措施 |
|--------|------|
| AI 模型 | GPT-4o-mini（$0.15/1M input，比 4o 便宜 17x） |
| CCXT 实例 | 3 个共享实例（原 7 个独立实例），省 ~300MB 内存 |
| Fetcher 频率 | prices 5min / technicals 15min / arbitrage 5min（原 30s） |
| 错误恢复 | uncaughtException + unhandledRejection 全局拦截，不 crash |
| Fetcher 延迟启动 | Server 启动 5 秒后再开始抓数据 |

## API Endpoints

### Auth

| Method | Path | 说明 |
|--------|------|------|
| `POST` | `/api/auth/send-code` | 发送验证码（Resend API） |
| `POST` | `/api/auth/verify` | 验证码校验 → session token |
| `POST` | `/api/auth/check` | 检查 session + 恢复 Binance token |
| `POST` | `/api/auth/logout` | 注销 session |

### User Data (需 `x-session-token`)

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/user/tasks` | 用户任务列表（builtin + 自定义） |
| `POST` | `/api/user/tasks` | 创建任务 |
| `DELETE` | `/api/user/tasks/:id` | 删除自定义任务 |
| `GET` | `/api/user/settings` | 用户设置（主题/语言/通知） |
| `PUT` | `/api/user/settings` | 更新设置 |
| `POST` | `/api/user/binance/connect` | 存储 Binance 加密 token |
| `POST` | `/api/user/binance/disconnect` | 移除 Binance token |

### Credentials

| Method | Path | 说明 |
|--------|------|------|
| `POST` | `/api/credentials/validate` | 验证 Binance API Key → 加密 token |
| `POST` | `/api/credentials/balance` | 查询真实 Binance 余额 |

### Agents

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/agents` | 列出所有 Agent（含 builtin 标记） |
| `POST` | `/api/agents/:id/chat` | 发送消息（含 tool calling + 用量记录） |
| `DELETE` | `/api/agents/:id` | 删除自定义 Agent |

### Teams

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/teams` | 列出所有分析群 |
| `POST` | `/api/teams/:id/chat` | 多 Agent 辩论（含 tool calling + 用量记录） |
| `DELETE` | `/api/teams/:id` | 删除自定义分析群 |

### Trading

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/trading/portfolio` | 真实 Binance 余额 + 持仓 |
| `POST` | `/api/trading/execute` | 手动交易（真实市价单） |
| `POST` | `/api/trading/ai-execute` | 单次 AI 辩论 → 可选自动执行 |
| `GET` | `/api/trading/orders/:symbol` | Binance 真实成交记录 |
| `GET` | `/api/trading/signals/:taskId` | 任务信号历史（全部，含 votes） |
| `POST` | `/api/trading/auto/start` | 启动 server 端自动交易 |
| `POST` | `/api/trading/auto/stop` | 暂停自动交易 |
| `GET` | `/api/trading/auto/status/:taskId` | 任务状态 + 全部信号 |
| `POST` | `/api/trading/auto/clear` | 清除信号 |

### Admin

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/admin` | AI 用量 Web Dashboard |
| `GET` | `/admin/api/summary` | 用量摘要（支持 ?days=N&email=X） |
| `GET` | `/admin/api/recent` | 最近 N 次 AI 调用 |
| `GET` | `/admin/api/context` | 按 team/task/email 筛选 |

### System

| Method | Path | 说明 |
|--------|------|------|
| `GET` | `/api/health` | 服务健康 + uptime + memory + fetcher 状态 |

## 项目结构

```
deeplink-app/
├── App.js                              # ThemeProvider + I18nProvider + Auth gate
├── SPEC.md                             # 完整产品规格书（1100+ 行）
├── src/
│   ├── api/                            # API 层
│   │   ├── config.js                   #   API_BASE_URL → deeplink.gotest24.com
│   │   ├── conversations.js            #   getAgents/Teams + delete
│   │   ├── chat.js                     #   getTeamChat/AgentChat + send
│   │   ├── tasks.js                    #   getTasks/addTask/deleteTask（server 端）
│   │   ├── settings.js                 #   getSettings/updateSettings（server 端）
│   │   └── profile.js                  #   getProfile
│   ├── i18n/                           # 多语言
│   │   ├── index.js                    #   I18nProvider + useI18n()
│   │   ├── zh-CN.js                    #   简体中文（~130 keys）
│   │   ├── zh-TW.js                    #   繁體中文
│   │   └── en.js                       #   English
│   ├── services/
│   │   └── notifications.js            #   Push notification 注册 + 本地通知
│   ├── utils/
│   │   └── formatTime.js              #   本地时区时间格式化
│   ├── components/
│   │   ├── CustomTabBar.js             #   药丸形 Tab Bar（i18n 标签）
│   │   └── IconMap.js                  #   icon name → Lucide 组件
│   ├── navigation/
│   │   └── AppNavigator.js             #   Stack + Tab（16 screens）
│   ├── screens/
│   │   ├── LoginScreen.js              #   邮箱验证码登录
│   │   ├── ConversationsScreen.js      #   对话列表 + 圆形操作按钮
│   │   ├── AgentChatScreen.js          #   Agent 一对一聊天
│   │   ├── TeamChatScreen.js           #   Team 多 Agent 辩论
│   │   ├── TeamDetailScreen.js         #   团队详情
│   │   ├── CreateAgentScreen.js        #   创建 Agent
│   │   ├── CreateTeamScreen.js         #   创建分析群（下拉选交易对）
│   │   ├── TasksScreen.js             #   任务仪表板
│   │   ├── TaskDetailScreen.js         #   任务详情（历史/交易/配置）
│   │   ├── DebateDetailScreen.js       #   分析详情（Agent 意见 + 投票）
│   │   ├── TradeDetailScreen.js        #   交易详情（订单 + 投票）
│   │   ├── CreateTaskScreen.js         #   创建任务（下拉选 + 开关）
│   │   ├── ProfileScreen.js            #   我的（真实 Binance 余额）
│   │   ├── ApiKeysScreen.js            #   Binance 密钥管理
│   │   ├── NotificationScreen.js       #   通知设置（同步 server）
│   │   └── LanguageScreen.js           #   语言切换
│   └── theme/
│       ├── colors.js                   #   lightColors + darkColors
│       ├── ThemeContext.js             #   ThemeProvider + useTheme()
│       └── index.js
```

## 快速开始

### 1. 启动后端

```bash
git clone https://github.com/ylshie/deeplink-server.git
cd deeplink-server
cp .env.example .env   # 填入 OPENAI_API_KEY + RESEND_API_KEY
npm install
npm start              # http://localhost:3000
# Admin Dashboard: http://localhost:3000/admin
```

### 2. 启动前端（开发）

```bash
git clone https://github.com/ylshie/deeplink-app.git
cd deeplink-app
npm install
npx expo start
```

### 3. 构建 Android APK

```bash
npx expo prebuild --platform android --clean
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
cd android && ./gradlew assembleRelease
# 输出: android/app/build/outputs/apk/release/app-release.apk
```

### 环境变量（Server .env）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | OpenAI API 密钥（必填） | — |
| `OPENAI_MODEL` | AI 模型 | `gpt-4o-mini` |
| `PORT` | 服务端口 | `3000` |
| `RESEND_API_KEY` | Resend 邮件 API 密钥（登录必填） | — |
| `EMAIL_FROM` | 发件人地址 | `onboarding@resend.dev` |
| `ENCRYPTION_KEY` | 密钥加密种子 | 内置默认值 |
| `LOG_TOOL` | Tool call 日志 | `0` |
| `LOG_FETCH` | Fetcher 日志 | `0` |
| `LOG_ALL` | 全部日志 | `0` |

## 监控

| 端点 | 用途 |
|------|------|
| `/api/health` | 服务健康、uptime、内存、fetcher 状态 |
| `/admin` | AI 用量 Dashboard（调用数/tokens/费用/Agent 排行/每日趋势） |
| `/api/trading/orders/BTC-USDT` | Binance 真实成交记录 |
| `/api/trading/auto/status` | 自动交易任务状态 |
