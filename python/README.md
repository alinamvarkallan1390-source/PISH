# Nexora Bot SDK برای پایتون 🐍

ساخت ربات برای پیام‌رسان **نکسورا** با پایتون، بدون هیچ وابستگی خارجی (فقط کتابخانهٔ استاندارد).

## شروع در ۳۰ ثانیه

```bash
# ۱) SDK را کنار پروژه‌ات بگذار
curl -O https://nexora-pish.vercel.app/sdk/nexora_bot.py

# ۲) توکن ربات را از /bots بگیر و اجرا کن
NEXORA_TOKEN="123456:AAH-..." python echo_bot.py
```

یا:

```python
from nexora_bot import Bot, inline_keyboard

bot = Bot("123456:AAH-...")

@bot.on("command:start")
def start(update):
    bot.send_message(
        update.chat_id,
        "سلام! 👋",
        reply_markup=inline_keyboard([[{"text": "شروع", "data": "go"}]]),
    )

@bot.on("message")
def echo(update):
    bot.reply(update, "🔁 " + update.text)

bot.run_polling()
```

## نصب به‌عنوان پکیج

```bash
pip install git+https://github.com/alinamvarkallan1390-source/PISH#subdirectory=python
```

## API سریع

| متد | کار |
| --- | --- |
| `bot.call("anyMethod", **params)` | فراخوانی خام هر متد |
| `bot.get_me()` | اطلاعات ربات |
| `bot.send_message(chat_id, text, reply_markup=…)` | ارسال متن |
| `bot.send_photo / send_document / send_voice / send_sticker` | مدیا |
| `bot.edit_message_text / delete_message / forward_message / pin_chat_message` | مدیریت پیام |
| `bot.set_webhook(url) / delete_webhook() / get_webhook_info()` | وبهوک |
| `bot.set_my_commands([...])` | منوی دستورها |
| `bot.run_polling()` | حلقهٔ دریافت رویداد |
| `bot.on("message" / "command:start" / "callback_query" / "any")` | هندلر |

هر متدی که در SDK تعریف نشده باشد هم به‌صورت خودکار به API وصل می‌شود:
`bot.send_poll_whatever(...)` → `sendPollWhatever`.

## نکته‌ها

- `update.text` / `update.chat_id` / `update.user` / `update.command` / `update.args` راحت‌ترین راه خواندن آپدیت‌اند.
- خطاها از نوع `NexoraError` هستند و `code` و `description` فارسی/انگلیسی دارند.
- برای وبهوک روی Vercel: `bot.set_webhook("https://your-app.vercel.app/api/webhook")`.
- نمونهٔ کامل: [`echo_bot.py`](./echo_bot.py)
