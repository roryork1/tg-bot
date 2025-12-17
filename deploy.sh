#!/bin/bash
echo "=== Telegram Bot 自动部署开始 ==="

sudo apt update -y
sudo apt install -y python3 python3-pip python3-venv git

mkdir -p /opt/tg-bot
cp -r . /opt/tg-bot
cd /opt/tg-bot

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cat <<EOF | sudo tee /etc/systemd/system/tgbot.service
[Unit]
Description=Telegram Bot Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/tg-bot
ExecStart=/opt/tg-bot/venv/bin/python3 bot.py
Restart=always
RestartSec=5
Environment=BOT_TOKEN=${BOT_TOKEN}
Environment=ADMIN_ID=${ADMIN_ID}
Environment=OPENAI_API_KEY=${OPENAI_API_KEY}
Environment=DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable tgbot
sudo systemctl restart tgbot

echo "部署完成，可查看日志： sudo journalctl -u tgbot -f"
