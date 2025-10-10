# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**PromptShooter** is a lightweight Chrome extension that enables users to send the same prompt to multiple AI chat platforms simultaneously. It's built as a Manifest V3 Chrome extension using vanilla JavaScript with no external dependencies.

### Supported Platforms
- **ChatGPT** (chatgpt.com) - GPT-5 Thinking and GPT-5 Instant models
- **Google Gemini** (gemini.google.com) - Gemini 2.5 Pro and 2.5 Flash models  
- **Anthropic Claude** (claude.ai) - Sonnet 4.5 and Opus 4.1 models with optional extended thinking

### Core Functionality
The extension allows users to:
1. Enter a prompt in a popup interface
2. Select which AI platforms to send the prompt to
3. Configure default models for each platform
4. Execute one-click distribution that opens/switches to platform tabs and automatically fills and sends the prompt

## Architecture & Key Components

### Extension Architecture
This is a **Manifest V3 Chrome Extension** with the following key architectural components:

- **Service Worker** (`background.js`) - Handles tab management, window creation, and coordinates message passing between popup and content scripts
- **Popup Interface** (`popup.html/js/css`) - Main user interface with platform selection, prompt input, and settings
- **Content Script** (`content.js`) - Injected into AI platform pages to handle DOM manipulation, model switching, and prompt submission
- **Icon Generation** (`generate-icons.sh`) - Shell script for generating icon files from SVG

### Message Passing Flow
1. **Popup → Background**: User clicks "send" → sends `{action: 'sendPrompt', prompt, platformConfigs}`
2. **Background → Content Scripts**: Creates new window/tabs → injects content scripts → sends `{action: 'fillAndSend', prompt, model, thinking}`
3. **Content Scripts**: Switch models → fill input fields → click send buttons → respond with status

### Platform-Specific DOM Selectors
The content script maintains platform-specific selector configurations in `PLATFORM_SELECTORS`:

```javascript path=/Users/iamin/Personal/for ClaudeCode/PromptShooter/content.js start=10
const PLATFORM_SELECTORS = {
  'chat.openai.com': {
    input: '#prompt-textarea, textarea[placeholder*="Message"], [contenteditable="true"][role="textbox"]',
    sendButton: 'button[data-testid="send-button"], button[aria-label*="Send"], button[data-testid="fruitjuice-send-button"]',
    name: 'ChatGPT'
  },
  'chatgpt.com': {
    input: '#prompt-textarea, textarea[placeholder*="Message"], [contenteditable="true"][role="textbox"]',
    sendButton: 'button[data-testid="send-button"], button[aria-label*="Send"], button[data-testid="fruitjuice-send-button"]',
    name: 'ChatGPT'
  },
  'gemini.google.com': {
    input: '.ql-editor.textarea, [contenteditable="true"].ql-editor, .ql-editor',
    sendButton: 'button.send-button, button[aria-label*="Send"], button[jslog*="send"]',
    name: 'Gemini'
  },
  'claude.ai': {
    input: 'div[contenteditable="true"].ProseMirror, div[contenteditable="true"][role="textbox"], fieldset [contenteditable="true"]',
    sendButton: 'button[aria-label="Send Message"], button[aria-label*="Send"], button[type="submit"]',
    name: 'Claude'
  }
};
```

### Model Switching Logic
Each platform has custom model switching logic:

- **ChatGPT**: Uses dropdown menu with `data-testid` attributes and text matching
- **Gemini**: Clicks model button, waits for menu, matches by aria-checked state
- **Claude**: Uses model selector dropdown and separate thinking toggle button

### Error Handling & User Experience
- **Graceful degradation**: If model switching fails, shows modal asking user to continue with default model
- **Adaptive delays**: Platform-specific timing delays to handle different loading speeds
- **Selector resilience**: Multiple fallback selectors for each platform element
- **Progress feedback**: Loading states and success/error messages

## Development Commands

### Icon Generation
```bash
# Generate PNG icons from SVG (requires librsvg or ImageMagick)
./generate-icons.sh

# Install librsvg on macOS (recommended)
brew install librsvg

# Install ImageMagick (alternative)
brew install imagemagick
```

### Extension Loading & Testing
```bash
# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the project directory

# Reload extension after code changes
# Click the reload button on the extension card in chrome://extensions/
```

### Debugging
```bash
# View extension logs
# 1. Right-click extension icon → "Inspect popup" (for popup.js)
# 2. chrome://extensions/ → Extension details → "Inspect views: background page" (for background.js)  
# 3. Open DevTools on AI platform pages to see content.js logs
```

## File Structure & Responsibilities

```
PromptShooter/
├── manifest.json          # Extension configuration & permissions
├── popup.html             # Main UI structure
├── popup.css              # UI styling with glass morphism design
├── popup.js               # UI logic, settings management, message sending
├── background.js          # Tab/window management, message routing
├── content.js             # DOM manipulation, platform integration
├── generate-icons.sh      # Icon generation script
├── assets/logos/          # Platform logos for UI
├── icons/                 # Extension icons (generated)
│   ├── icon.svg          # Source SVG
│   └── *.png             # Generated PNG files
└── README.md             # Chinese documentation
```

### Key Files to Modify

**Adding New Platform Support:**
1. Update `PLATFORM_SELECTORS` in `content.js` with new platform selectors
2. Add platform URL patterns to `manifest.json` host_permissions
3. Add platform configuration to `PLATFORMS` object in `background.js`
4. Update popup UI in `popup.html` and corresponding JavaScript

**Updating Selectors (when platforms change UI):**
1. Inspect the target platform's DOM structure
2. Update relevant selectors in `PLATFORM_SELECTORS`
3. Test model switching functions (`switchChatGPTModel`, `switchGeminiModel`, `switchClaudeModel`)

**UI Modifications:**
- `popup.html/css/js` for interface changes
- `assets/logos/` for platform branding
- Icon files need regeneration if `icons/icon.svg` is modified

## Testing Strategy

### Manual Testing Checklist
1. **Icon Generation**: Verify all PNG icons generate correctly
2. **Extension Loading**: Extension loads without errors in chrome://extensions/
3. **Platform Integration**: Test prompt sending to each platform individually
4. **Model Switching**: Verify each model option works correctly
5. **Multi-platform**: Test sending to all platforms simultaneously
6. **Edge Cases**: Test with empty prompts, very long prompts, and when logged out of platforms

### Debugging Platform Issues
When a platform stops working (common due to UI changes):

1. **Check Console Logs**: Look for errors in content script execution
2. **Inspect Selectors**: Use DevTools to verify DOM selectors still exist
3. **Test Model Switching**: Ensure model switching logic still works
4. **Verify Permissions**: Check if platform URLs are still covered by host_permissions

## Platform-Specific Notes

### ChatGPT
- Uses both old (chat.openai.com) and new (chatgpt.com) domains
- Model switching relies on `data-testid` attributes when available
- Has both dropdown and pill-style model selectors

### Gemini  
- Uses Quill editor which requires special input handling
- Model menu uses Material Design components with `aria-checked` states
- Requires longer load delays due to heavy JavaScript

### Claude
- Uses ProseMirror editor for contenteditable input
- Has separate model dropdown and thinking toggle button
- Model verification checks for specific display text

## Extension Permissions

The extension requires these Chrome permissions:
- `tabs` - Create and manage browser tabs
- `scripting` - Inject content scripts into platform pages  
- `storage` - Store user preferences (selected platforms, default models)
- Host permissions for each supported AI platform domain

## Troubleshooting Common Issues

**"Selector Failed" Errors**: Platform UI has changed, update selectors in `content.js`

**Model Switching Not Working**: Check if platform has changed model switching UI, update corresponding switch function

**Popup Not Opening**: Check for JavaScript errors in popup.js, inspect popup with DevTools

**Content Script Injection Failing**: Verify host_permissions in manifest.json include the target platform

**Icons Not Displaying**: Ensure PNG files exist in `icons/` directory, run `./generate-icons.sh`