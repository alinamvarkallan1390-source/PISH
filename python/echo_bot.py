"""
ربات نمونهٔ نکسورا با پایتون (echo + دستورها)
============================================

اجرا:

    NEXORA_TOKEN="123456:AAH-..." python echo_bot.py

اگر SDK را جدا دانلود کردی کنار همین فایل بگذار (nexora_bot.py).
"""

import os
from nexora_bot import Bot, inline_keyboard

TOKEN = os.environ.get("NEXORA_TOKEN", "PUT-YOUR-TOKEN-HERE")
bot = Bot(TOKEN)


@bot.on("command:start")
def start(update):
    name = update.user.get("first_name", "دوست من")
    bot.send_message(
        update.chat_id,
        f"سلام {name}! 👋\n"
        "من یک ربات پایتونی روی نکسورا هستم.\n"
        "دستورها:\n"
        "/help — راهنما\n"
        "/time — ساعت سرور\n"
        "/vote — نمونهٔ دکمهٔ شیشه‌ای",
        reply_markup=inline_keyboard(
            [
                [
                    {"text": "راهنما 📘", "data": "help"},
                    {"text": "سایت 🌐", "data": "site"},
                ]
            ]
        ),
    )


@bot.on("command:help")
def help_cmd(update):
    bot.send_message(
        update.chat_id,
        "این ربات فقط ۶۰ خط پایتون است 🐍\n"
        "کدش را در پنل ربات‌ساز یا صفحهٔ /python ببین و برای خودت تغییرش بده.",
    )


@bot.on("command:time")
def time_cmd(update):
    from datetime import datetime

    bot.send_message(update.chat_id, "🕒 " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))


@bot.on("command:vote")
def vote(update):
    bot.send_message(
        update.chat_id,
        "کدام قابلیت را بیشتر دوست داری؟",
        reply_markup=inline_keyboard(
            [
                [{"text": "پایتون 🐍", "data": "py"}],
                [{"text": "نظرسنجی 📊", "data": "poll"}],
                [{"text": "تماس صوتی 📞", "data": "call"}],
            ]
        ),
    )


@bot.on("callback_query")
def on_button(update):
    data = (update.get("callback_query") or {}).get("data", "")
    answers = {
        "help": "بله؟ اینم راهنما: /help را بزن 😄",
        "site": "https://nexora-pish.vercel.app",
        "py": "پایتون بهترین انتخاب برای ربات است 🐍",
    }
    bot.send_message(update.chat_id, answers.get(data, f"دکمهٔ «{data}» را زدی ✅"))


@bot.on("message")
def echo(update):
    if update.text.startswith("/"):
        return
    bot.send_message(update.chat_id, "🔁 " + (update.text or "چیزی نگفتی؟"))


if __name__ == "__main__":
    print("Nexora echo bot is running… (Ctrl+C برای توقف)")
    bot.run_polling()
