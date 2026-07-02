#!/bin/bash
# 一键打包 Reasonix-Mario 安装包（自动带版本号）
# 用法: ./build-installer.sh [版本号]
#
# 如果未传版本号，读取 VERSION 文件的内容。
# 版本号会写入 wails.json 的 productVersion 字段，
# 安装包输出文件名也会包含版本号。

set -e
cd "$(dirname "$0")"

# ── 版本号 ──────────────────────────────────────────────────────────────
if [ -n "$1" ]; then
  VER="$1"
  echo "$VER" > VERSION
else
  VER=$(cat VERSION | tr -d '\r\n' | xargs)
fi
echo "==> 打包版本: $VER"

# ── 注入版本号到 wails.json ─────────────────────────────────────────────
if ! grep -q "\"productVersion\": \"$VER\"" wails.json; then
  sed -i "s/\"productVersion\": \"[^\"]*\"/\"productVersion\": \"$VER\"/" wails.json
fi

# ── 构建 ────────────────────────────────────────────────────────────────
export GOPROXY=https://goproxy.cn,direct
export GOSUMDB=off
export PATH="$PATH:/c/Program Files (x86)/NSIS/Bin"

wails build --nsis

# ── 重命名输出文件，加版本号 ────────────────────────────────────────────
BASE="build/bin/reasonix-mario-amd64-installer.exe"
TARGET="build/bin/reasonix-mario-v${VER}-amd64-installer.exe"
if [ -f "$BASE" ]; then
  mv "$BASE" "$TARGET"
  echo "==> 安装包已生成: $TARGET"
else
  echo "!! 构建可能失败，找不到 $BASE"
  exit 1
fi
