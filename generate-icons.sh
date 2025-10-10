#!/bin/bash

# PromptShooter 图标生成脚本
# 需要安装 ImageMagick 或 rsvg-convert

ICON_SVG="icons/icon.svg"
SIZES=(16 32 48 128)

# 检查 SVG 文件是否存在
if [ ! -f "$ICON_SVG" ]; then
    echo "错误: 找不到 $ICON_SVG"
    exit 1
fi

# 尝试使用 rsvg-convert (推荐，质量更好)
if command -v rsvg-convert &> /dev/null; then
    echo "使用 rsvg-convert 生成图标..."
    for size in "${SIZES[@]}"; do
        rsvg-convert -w $size -h $size "$ICON_SVG" -o "icons/icon${size}.png"
        echo "生成 icon${size}.png"
    done
    echo "✅ 所有图标生成完成!"
    exit 0
fi

# 尝试使用 ImageMagick
if command -v convert &> /dev/null; then
    echo "使用 ImageMagick 生成图标..."
    for size in "${SIZES[@]}"; do
        convert -background none -resize ${size}x${size} "$ICON_SVG" "icons/icon${size}.png"
        echo "生成 icon${size}.png"
    done
    echo "✅ 所有图标生成完成!"
    exit 0
fi

# 如果都没有，提供安装建议
echo "❌ 未找到图标转换工具"
echo ""
echo "请安装以下工具之一："
echo ""
echo "macOS (Homebrew):"
echo "  brew install librsvg     # 推荐"
echo "  brew install imagemagick"
echo ""
echo "或者使用在线工具："
echo "  https://favicon.io/"
echo "  https://www.favicon-generator.org/"
echo ""
echo "将 icons/icon.svg 上传到这些网站，下载生成的 PNG 文件"
echo "然后将文件重命名为: icon16.png, icon32.png, icon48.png, icon128.png"
