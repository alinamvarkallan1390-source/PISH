#!/usr/bin/env bash
# ساخت زیپ کامل سورس نکسورا (بدون فایل‌های محرمانه و بدون node_modules)
# اجرا:  bash scripts/pack-source.sh
set -euo pipefail
cd "$(dirname "$0")/.."

OUT_DIR="public"
OUT="$OUT_DIR/nexora-source.zip"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

mkdir -p "$OUT_DIR" "$STAGE/nexora"

# فقط فایل‌های سورس را کپی می‌کنیم؛ هیچ .env، کلید، دیتابیس یا کشی داخل زیپ نمی‌رود.
cp -R app components lib python "$STAGE/nexora/"
cp package.json package-lock.json tsconfig.json next.config.mjs next-env.d.ts types.d.ts \
   README.md .env.example .gitignore "$STAGE/nexora/"
cp scripts/pack-source.sh "$STAGE/nexora/" 2>/dev/null || true

# اگر روزی فایلی شبیه .env یا کلید اضافه شد، این‌جا حذف می‌شود (لایهٔ دوم اطمینان).
find "$STAGE/nexora" -type f \( -name '.env*' ! -name '.env.example' \
  -o -name '*.pem' -o -name '*.key' -o -name '*.p12' -o -name 'id_rsa*' \
  -o -name '*.sqlite' -o -name '*.db' -o -name '*.tsbuildinfo' \) -delete
find "$STAGE/nexora" -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true

rm -f "$OUT"
( cd "$STAGE" && zip -qr -9 nexora-source.zip nexora )
mv "$STAGE/nexora-source.zip" "$OUT"

echo "✓ ساخته شد: $OUT ($(du -h "$OUT" | cut -f1))"
echo "  فایل‌ها: $(unzip -l "$OUT" | tail -1 | awk '{print $2}')"
