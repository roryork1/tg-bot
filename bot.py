from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters
from config import BOT_TOKEN
from database.db import init_db
from handlers.start import start
from handlers.help import help_cmd
from handlers.echo import echo
from handlers.admin import users
from handlers.ai_reply import ai_answer, current_model


async def ai(update, context):
    text = " ".join(context.args)
    if not text:
        return await update.message.reply_text("格式：/ai 你的问题")

    reply = await ai_answer(text)
    await update.message.reply_text(reply)


async def model(update, context):
    global current_model
    if not context.args:
        return await update.message.reply_text(f"当前模型：{current_model}")

    m = context.args[0].lower()
    if m not in ["openai", "deepseek"]:
        return await update.message.reply_text("使用：/model openai 或 /model deepseek")

    current_model = m
    await update.message.reply_text(f"模型已切换为：{current_model}")


def main():
    init_db()

    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_cmd))
    app.add_handler(CommandHandler("ai", ai))
    app.add_handler(CommandHandler("model", model))
    app.add_handler(CommandHandler("users", users))

    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))

    print("Bot 正在运行...")
    app.run_polling()


if __name__ == "__main__":
    main()
