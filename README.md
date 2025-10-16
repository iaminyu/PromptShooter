# PromptShooter

## 简介（中文）

PromptShooter 是一款轻量级的 Chrome 扩展，可以将同一条提示词一键分发到 ChatGPT、Google Gemini、Anthropic Claude 等多个主流 AI 平台。扩展会自动打开目标标签页、切换到用户预设的模型，并模拟输入和发送操作，减少来回复制粘贴的时间。

### 主要特性

- 🎯 **一键分发**：一次输入，自动打开或切换至多个 AI 聊天页面并发送提示词  
- ⚙️ **模型记忆**：为每个平台保存默认模型与 Claude 的扩展思考选项  
- 🌐 **多语言界面**：默认跟随浏览器语言，也支持在设置中手动切换（英文、简体中文、日语、韩语、西班牙语、德语、法语、葡萄牙语（巴西））  
- ⚡ **快速派发**：优化的重试机制，页面准备就绪后立即输入并发送  
- 🔒 **本地执行**：所有逻辑均在浏览器本地完成，不上传任何提示词或用户数据

### 安装与使用

1. 克隆或下载本仓库，确保 `icons/` 内的 PNG 图标已经就绪。  
2. 打开 Chrome，访问 `chrome://extensions/`，开启右上角“开发者模式”。  
3. 点击“加载已解压的扩展程序”，选择项目根目录。  
4. 点击工具栏中的 PromptShooter 图标：  
   - 输入提示词  
   - 选择要分发的平台  
   - 如需调整模型或界面语言，进入“设置”页面  
   - 点击“一键发送”按钮，扩展会自动在各平台执行发送

### 注意事项

- 使用前需在每个平台保持登录状态；未登录的平台会静默失败但不会影响其他平台  
- 各站点的 DOM 结构若有更新，可能需要调整 `content.js` 中的选择器  
- 若在商店发布版本，请确认 `manifest.json` 中的权限说明、隐私政策及商店素材已更新

### 项目结构

```
PromptShooter/
├── manifest.json        # 插件配置 (Manifest V3)
├── popup.html           # 弹出页面结构
├── popup.css            # 弹出页面样式
├── popup.js             # 弹出页面逻辑与多语言
├── background.js        # Service Worker，负责创建标签页与消息分发
├── content.js           # 内容脚本，负责填充提示词并发送
├── icons/               # 扩展图标（16/32/48/128/256/512 PNG）
├── assets/              # 其他资源（如 logo）
└── README.md
```

### 更新记录

- **v1.1**：新增多语言界面、语言选择器、快速派发机制与最新图标  
- **v1.0**：初始版本，支持 ChatGPT、Gemini、Claude 的一键分发

---

## Overview (English)

PromptShooter is a lightweight Chrome extension that distributes the same prompt to multiple AI chat platforms—ChatGPT, Google Gemini, Anthropic Claude—with a single click. It opens or focuses the required tabs, switches to your preferred models, fills the prompt, and sends it on your behalf.

### Key Features

- 🎯 **One-shot distribution**: Type once, and PromptShooter delivers the prompt to every selected AI tab  
- ⚙️ **Model memory**: Remembers the default model per platform plus Claude’s extended thinking toggle  
- 🌐 **Multilingual UI**: Follows the browser language by default or let users pick among EN, zh-CN, ja, ko, es, de, fr, pt-BR  
- ⚡ **Faster dispatch**: Retry-based readiness checks minimise waiting once the page is ready  
- 🔒 **Local only**: No prompts or user data leave the browser; everything runs client-side

### Installation & Usage

1. Clone or download this repository; ensure the PNG icons in `icons/` are present.  
2. Open Chrome and visit `chrome://extensions/`, enable **Developer mode**.  
3. Click **Load unpacked** and select the project root.  
4. Use the toolbar icon to open the popup:  
   - Enter your prompt  
   - Select the AI platforms to target  
   - Adjust default models or interface language on the Settings screen if needed  
   - Press **Send to all** and the extension will handle tab creation, input, and submission

### Notes

- Stay signed in on each AI platform for automation to succeed; failures on one site do not affect others  
- If any site changes its DOM, update the selectors in `content.js` so the script can locate inputs/buttons again  
- When preparing a Chrome Web Store release, review the manifest permissions, privacy statement, and listing assets

### Project Structure

```
PromptShooter/
├── manifest.json        # Manifest V3 configuration
├── popup.html / css / js
├── background.js        # Service Worker creating tabs and messaging content scripts
├── content.js           # Injected script handling form fill & send actions
├── icons/               # Packaged icons (16, 32, 48, 128, 256, 512 PNG)
├── assets/              # Additional assets (e.g., logos)
└── README.md
```

### Changelog

- **v1.1**: Added multilingual UI, language selector, faster dispatch loop, and refreshed icons  
- **v1.0**: Initial MVP with one-click distribution to ChatGPT, Gemini, and Claude

### License & Contributions

This project is released under the MIT License. Issues and pull requests are welcome—feel free to contribute improvements or new platform integrations.
