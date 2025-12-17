# Advanced Telegram Bot

这是一个可直接部署到 VPS 的高级 Telegram Bot，支持：

- OpenAI + DeepSeek AI 回复
- SQLite 用户数据库
- 多命令系统
- systemd 后台启动
- 一键部署脚本（deploy.sh）

## 文件说明

🔥 VPS 一键部署脚本 deploy.sh
- 自动安装 Python
- 自动创建虚拟环境
- 自动安装项目依赖
- 自动创建 systemd 服务后台运行
- 自动启动机器人
- 自动重启机制

🔥 ai_reply.py 完整版本（可选双模型）
- 自动根据你选择的模型回复
- 支持流式响应（可选）
- 支持模型切换指令 /model
	
## 主要命令

| 命令 | 功能 |
|------|------|
| /start | 开始使用机器人 |
| /help | 查看帮助 |
| /ai 文字 | AI 回复 |
| /model openai/deepseek | 切换 AI 模型 |
| /users | 查看用户（管理员） |

---

## 📦 部署步骤（Ubuntu / Debian）

### 1. 上传项目到 VPS

```bash
scp bot_project.zip root@your_vps_ip:/opt/
cd /opt
unzip bot_project.zip
```

### 2. 设置环境变量

```bash
export BOT_TOKEN="你的TG机器人token"
export ADMIN_ID="你的Telegram数字ID"
export OPENAI_API_KEY="你的OpenAI key"
export DEEPSEEK_API_KEY="你的DeepSeek key"
```
获取 BOT_TOKEN:
在 Telegram 中打开 @BotFather 输入 /newbot 获取TG机器人token

### 3. 执行一键部署

```bash
bash deploy.sh
```

### 4. 查看日志

```bash
sudo journalctl -u tgbot -f
```

---

## 📁 项目结构

```
advanced_tg_bot/
│ bot.py
│ config.py
│ requirements.txt
│ deploy.sh
│ README.md
│
├── handlers/
│      start.py
│      help.py
│      echo.py
│      admin.py
│      ai_reply.py
│
└── database/
       db.py
```
---
