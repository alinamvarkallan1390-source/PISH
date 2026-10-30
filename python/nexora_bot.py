"""
Nexora Bot SDK — Python edition
================================
یک کتابخانهٔ کامل و بدون وابستگی برای ساخت ربات در پیام‌رسان نکسورا.

نصب: فقط همین فایل را کنار پروژه‌ات بگذار (بدون pip، بدون dependency).

    from nexora_bot import Bot

    bot = Bot("123456:AAH-TOKEN")

    @bot.on("message")
    def handle(update):
        bot.send_message(update["message"]["chat"]["id"], "سلام! 👋")

    bot.run_polling()

مستندات کامل: https://nexora-pish.vercel.app/python
"""

from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Callable, Dict, Iterable, List, Optional

__all__ = ["Bot", "NexoraError", "Update", "document", "inline_keyboard"]
__version__ = "1.0.0"

DEFAULT_BASE_URL = "https://nexora-pish.vercel.app"

log = logging.getLogger("nexora.bot")


class NexoraError(Exception):
    """خطای پاسخ Bot API نکسورا."""

    def __init__(self, description: str, code: int = 400, payload: Optional[dict] = None):
        super().__init__(description)
        self.description = description
        self.code = code
        self.payload = payload or {}


class Update(dict):
    """dict با دسترسی نقطه‌ای راحت: update.message / update.text"""

    @property
    def message(self) -> Dict[str, Any]:
        return self.get("message") or {}

    @property
    def text(self) -> str:
        return (self.message.get("text") or "").strip()

    @property
    def chat_id(self) -> Optional[str]:
        return (self.message.get("chat") or {}).get("id")

    @property
    def user(self) -> Dict[str, Any]:
        return self.message.get("from") or {}

    @property
    def command(self) -> Optional[str]:
        """اگر پیام یک دستور باشد (مثل /start) نام دستور را برمی‌گرداند."""
        if not self.text.startswith("/"):
            return None
        return self.text[1:].split("@")[0].split(" ")[0].lower()

    @property
    def args(self) -> str:
        if not self.text.startswith("/"):
            return self.text
        parts = self.text.split(maxsplit=1)
        return parts[1] if len(parts) > 1 else ""


def inline_keyboard(rows: Iterable[Iterable[Dict[str, str]]]) -> Dict[str, Any]:
    """ساخت کیبورد شیشه‌ای:
    inline_keyboard([[{"text": "شروع", "data": "start"}]])
    """
    return {"inline_keyboard": [[dict(btn) for btn in row] for row in rows]}


def document(path_or_id: str) -> str:
    """مسیر فایل آپلودشده (media_id) برای send_document/send_photo."""
    return path_or_id


class Bot:
    """کلاینت Bot API نکسورا."""

    def __init__(
        self,
        token: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = 30.0,
        retries: int = 2,
        debug: bool = False,
    ) -> None:
        if not token or ":" not in token:
            raise ValueError("توکن ربات نامعتبر است (به شکل 1234:AAH... است)")
        self.token = token.strip()
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.retries = retries
        self._handlers: Dict[str, List[Callable[[Update], Any]]] = {}
        self._offset = 0
        if debug:
            logging.basicConfig(level=logging.DEBUG)

    # ------------------------------------------------------------------ core
    @property
    def api_url(self) -> str:
        return f"{self.base_url}/api/bot/{self.token}"

    def call(self, method: str, **params: Any) -> Any:
        """فراخوانی خام هر متد Bot API."""
        url = f"{self.api_url}/{method}"
        body = json.dumps({k: v for k, v in params.items() if v is not None}).encode("utf-8")
        last_error: Optional[Exception] = None

        for attempt in range(self.retries + 1):
            req = urllib.request.Request(
                url,
                data=body,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
            except urllib.error.HTTPError as exc:  # 4xx/5xx
                raw = exc.read().decode("utf-8", "replace")
                try:
                    data = json.loads(raw)
                except json.JSONDecodeError:
                    data = {"ok": False, "description": raw or str(exc), "error_code": exc.code}
            except (urllib.error.URLError, TimeoutError) as exc:  # شبکه
                last_error = exc
                if attempt < self.retries:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                raise NexoraError(f"اتصال به سرور برقرار نشد: {exc}") from exc

            if data.get("ok"):
                return data.get("result")
            raise NexoraError(
                data.get("description") or data.get("error") or "خطای ناشناخته",
                data.get("error_code", 400),
                data,
            )

    def __getattr__(self, name: str) -> Callable[..., Any]:
        """هر متدی که صریح تعریف نشده باشد به‌صورت snake_case به API وصل می‌شود."""
        if name.startswith("_"):
            raise AttributeError(name)
        method = "".join(part.capitalize() for part in name.split("_"))
        method = method[0].lower() + method[1:] if method else name

        def wrapper(**params: Any) -> Any:
            return self.call(method, **params)

        return wrapper

    # --------------------------------------------------------------- helpers
    def get_me(self) -> Dict[str, Any]:
        return self.call("getMe")

    def get_updates(self, offset: int = 0, limit: int = 50, timeout: int = 0) -> List[Update]:
        rows = self.call("getUpdates", offset=offset, limit=limit, timeout=timeout) or []
        return [row if isinstance(row, Update) else Update(row) for row in rows]

    def set_webhook(self, url: str, secret_token: Optional[str] = None) -> bool:
        return bool(self.call("setWebhook", url=url, secret_token=secret_token))

    def delete_webhook(self) -> bool:
        return bool(self.call("deleteWebhook"))

    def get_webhook_info(self) -> Dict[str, Any]:
        return self.call("getWebhookInfo")

    def send_message(
        self,
        chat_id: str,
        text: str,
        reply_markup: Optional[Dict[str, Any]] = None,
        reply_to_message_id: Optional[str] = None,
        parse_mode: Optional[str] = None,
    ) -> Dict[str, Any]:
        return self.call(
            "sendMessage",
            chat_id=chat_id,
            text=text,
            reply_markup=reply_markup,
            reply_to_message_id=reply_to_message_id,
            parse_mode=parse_mode,
        )

    def send_photo(self, chat_id: str, photo_id: str, caption: str = "") -> Dict[str, Any]:
        return self.call("sendPhoto", chat_id=chat_id, photo=photo_id, caption=caption)

    def send_document(self, chat_id: str, document_id: str, caption: str = "") -> Dict[str, Any]:
        return self.call("sendDocument", chat_id=chat_id, document=document_id, caption=caption)

    def send_voice(self, chat_id: str, voice_id: str, caption: str = "") -> Dict[str, Any]:
        return self.call("sendVoice", chat_id=chat_id, voice=voice_id, caption=caption)

    def send_sticker(self, chat_id: str, emoji: str = "⭐") -> Dict[str, Any]:
        return self.call("sendSticker", chat_id=chat_id, emoji=emoji)

    def edit_message_text(self, chat_id: str, message_id: str, text: str) -> Dict[str, Any]:
        return self.call("editMessageText", chat_id=chat_id, message_id=message_id, text=text)

    def delete_message(self, message_id: str) -> bool:
        return bool(self.call("deleteMessage", message_id=message_id))

    def forward_message(self, chat_id: str, from_chat_id: str, message_id: str) -> Dict[str, Any]:
        return self.call(
            "forwardMessage", chat_id=chat_id, from_chat_id=from_chat_id, message_id=message_id
        )

    def pin_chat_message(self, message_id: str) -> bool:
        return bool(self.call("pinChatMessage", message_id=message_id))

    def send_chat_action(self, chat_id: str, action: str = "typing") -> bool:
        return bool(self.call("sendChatAction", chat_id=chat_id, action=action))

    def set_my_commands(self, commands: Iterable[Dict[str, str]]) -> bool:
        return bool(self.call("setMyCommands", commands=list(commands)))

    def answer_callback_query(self, callback_query_id: str, text: str = "") -> bool:
        return bool(self.call("answerCallbackQuery", callback_query_id=callback_query_id, text=text))

    # -------------------------------------------------------------- dispatch
    def on(self, event: str, handler: Optional[Callable[[Update], Any]] = None):
        """ثبت هندلر: bot.on("message")(fn) یا به‌صورت دکوراتور @bot.on("message").

        رویدادها: message ، command ، callback_query ، any
        """
        def register(fn: Callable[[Update], Any]) -> Callable[[Update], Any]:
            self._handlers.setdefault(event, []).append(fn)
            return fn

        return register(handler) if handler else register

    def _dispatch(self, raw: Dict[str, Any]) -> None:
        update = Update(raw)
        fired = set()

        events = ["any"]
        if update.get("type") == "callback_query" or "callback_query" in update:
            events.append("callback_query")
        if update.get("message"):
            events.append("message")
            command = update.command
            if command:
                events.append(f"command:{command}")
                events.append("command")

        for event in events:
            for handler in self._handlers.get(event, []):
                fired.add(id(handler))
                try:
                    handler(update)
                except Exception:  # یک هندلر خراب نباید کل ربات را بخواباند
                    log.exception("handler %s failed on event %s", getattr(handler, "__name__", "?"), event)

        if not fired and update.get("message"):
            # رفتار پیش‌فرض وقتی هندلری ثبت نشده: echo
            log.debug("no handler for update %s", update.get("update_id"))

    def run_polling(self, interval: float = 1.0, drop_pending: bool = False) -> None:
        """حلقهٔ long-polling (بی‌نهایت). با Ctrl+C متوقف می‌شود."""
        if drop_pending:
            pending = self.get_updates(offset=0, limit=100)
            if pending:
                self._offset = int(pending[-1].get("update_id", 0)) + 1

        log.info("Nexora bot started (polling) — %s", self.api_url)
        while True:
            try:
                updates = self.get_updates(offset=self._offset, limit=100)
                if not updates:
                    time.sleep(interval)
                    continue
                for raw in updates:
                    self._offset = int(raw.get("update_id", 0)) + 1
                    self._dispatch(raw)
            except KeyboardInterrupt:
                log.info("stopped by user")
                return
            except NexoraError as exc:
                log.warning("API error: %s", exc)
                time.sleep(3)
            except Exception:  # شبکه قطع شد
                log.exception("polling failed, retrying…")
                time.sleep(3)

    # ------------------------------------------------------------ convenience
    def reply(self, update: Update, text: str, **kwargs: Any) -> Dict[str, Any]:
        return self.send_message(update.chat_id or "", text, **kwargs)

    def start(self) -> None:
        """میان‌بر برای run_polling"""
        self.run_polling()

    def __repr__(self) -> str:
        head = self.token.split(":")[0]
        return f"<NexoraBot token=…{head} base={self.base_url}>"
