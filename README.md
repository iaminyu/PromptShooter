# PromptShooter V1.0

一款轻量级 Chrome 浏览器插件，可以将提示词一次性发送到多个主流 AI 聊天平台。

## 功能特点

- 🎯 **一键分发**: 将同一个提示词同时发送到多个 AI 平台
- 🚀 **支持平台**: ChatGPT、Google Gemini、Anthropic Claude
- 💾 **记忆选择**: 自动记住上次选择的平台组合
- 🎨 **简洁界面**: 极简设计，专注核心功能

## 安装方法

### 1. 加载到 Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的 "开发者模式"
4. 点击 "加载已解压的扩展程序"
5. 选择本项目文件夹

## 使用方法

1. 点击浏览器工具栏上的 PromptShooter 图标
2. 在文本框中输入你的提示词
3. 勾选想要发送的平台（ChatGPT、Gemini、Claude）
4. 点击"一键发送"按钮
5. 插件会自动打开或切换到对应平台的标签页，并发送提示词

## 注意事项

- ✅ 使用前需要先登录各个 AI 平台
- ✅ 如果某个平台未登录，该平台的操作会静默失败，不影响其他平台
- ✅ 插件通过 DOM 操作实现，不调用 API
- ✅ 各平台的页面结构变化可能导致选择器失效，需要更新 `content.js`

## 项目结构

```
PromptShooter/
├── manifest.json       # 插件配置文件
├── popup.html          # 弹出窗口 HTML
├── popup.css           # 弹出窗口样式
├── popup.js            # 弹出窗口逻辑
├── background.js       # 后台服务 Worker
├── content.js          # 内容脚本（注入到目标页面）
├── icons/              # 图标文件
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── icon.svg
└── README.md
```

## 技术栈

- Manifest V3
- Chrome Extension APIs
- Vanilla JavaScript (无依赖)

## 验收标准

- [x] FR-01: 插件弹出窗口显示正常
- [x] FR-02: 支持 ChatGPT、Gemini、Claude 三个平台
- [x] FR-03: 实现核心分发逻辑
- [x] 文本框为空时发送按钮禁用
- [x] 平台选择状态持久化
- [x] 自动打开或切换到目标平台标签页
- [x] 自动填充并发送提示词

## 故障排除

### 发送失败

1. **检查是否已登录**: 确保在目标平台已登录
2. **检查页面 URL**: 确认是在正确的聊天页面（不是登录页或主页）
3. **查看控制台**: 打开开发者工具 Console 查看错误信息

### 选择器失效

如果某个平台的页面结构更新导致功能失效：

1. 打开 `content.js`
2. 找到对应平台的选择器配置
3. 使用浏览器开发者工具检查新的选择器
4. 更新配置并重新加载插件

## 版本历史

### V1.0.0 (MVP)
- 初始版本
- 支持 ChatGPT、Google Gemini、Anthropic Claude
- 实现一键分发核心功能

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
