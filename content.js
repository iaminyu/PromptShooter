// 防止重复注入
if (window.__PROMPTSHOOTER_LOADED__) {
  console.log('[PromptShooter] 脚本已加载，跳过重复注入');
} else {
  window.__PROMPTSHOOTER_LOADED__ = true;
  console.log('[PromptShooter] 脚本首次加载');
}

// 平台特定的选择器配置
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

// 模型显示名称映射
const MODEL_DISPLAY_NAMES = {
  'gpt-5-thinking': 'ChatGPT 5 Thinking',
  'gpt-5-insta': 'ChatGPT 5 Instant',
  '2.5-pro': 'Gemini 2.5 Pro',
  '2.5-flash': 'Gemini 2.5 Flash',
  'sonnet-4.5': 'Claude Sonnet 4.5',
  'opus-4.1': 'Claude Opus 4.1'
};

const CHATGPT_MODEL_ALIASES = {
  'gpt-5-thinking': ['Thinking'],
  'gpt-5-insta': ['Instant']
};

const CHATGPT_MODEL_TEST_IDS = {
  'gpt-5-thinking': 'model-switcher-gpt-5-thinking',
  'gpt-5-insta': 'model-switcher-gpt-5-instant'
};

const GEMINI_MODEL_ALIASES = {
  '2.5-pro': ['2.5 Pro', 'Reasoning'],
  '2.5-flash': ['2.5 Flash', 'Fast all-round']
};

const CLAUDE_MODEL_DISPLAY = {
  'sonnet-4.5': 'Sonnet 4.5',
  'opus-4.1': 'Opus 4.1'
};

const GEMINI_MENU_SELECTORS = [
  'button[role="menuitemradio"]',
  '.bard-mode-list-button',
  '.mode-list-button',
  'mat-mdc-menu-item button',
  'mat-option',
  '.mode-option button'
];

const ALL_CHATGPT_MODEL_LABELS = ['Auto', ...new Set(Object.values(CHATGPT_MODEL_ALIASES).flat())];

function getChatGPTModelAliases(model) {
  return CHATGPT_MODEL_ALIASES[model] || [];
}

function getGeminiModelAliases(model) {
  return GEMINI_MODEL_ALIASES[model] || [];
}

function textContainsAnyLabel(text, labels) {
  if (!text) return false;
  const normalized = text.trim();
  return labels.some(label => normalized.includes(label) || normalized.startsWith(label));
}

function isElementVisible(el) {
  return !!el && el.offsetParent !== null;
}

async function waitForVisibleElements(selectors, attempts = 10, delay = 150) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    let elements = [];
    for (const selector of selectors) {
      elements = elements.concat(Array.from(document.querySelectorAll(selector)));
    }
    const visible = elements.filter(isElementVisible);
    if (visible.length > 0) {
      return visible;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return [];
}

async function getGeminiMenuItems() {
  const items = await waitForVisibleElements(GEMINI_MENU_SELECTORS, 12, 150);
  const unique = [];
  const seen = new Set();
  for (const item of items) {
    const key = item.outerHTML.slice(0, 200);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }
  return unique;
}

// 获取当前平台的选择器
function getPlatformSelectors() {
  const hostname = window.location.hostname;
  return PLATFORM_SELECTORS[hostname] || null;
}

// 查找元素（支持多个选择器）
function findElement(selectors) {
  const selectorList = selectors.split(',').map(s => s.trim());

  for (const selector of selectorList) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }

  return null;
}

// 等待元素出现
function waitForElement(selectors, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = findElement(selectors);
    if (element) {
      return resolve(element);
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = findElement(selectors);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 超时处理
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`元素未找到: ${selectors}`));
    }, timeout);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForSendButtonReady(selectors, timeout = 6000) {
  const deadline = Date.now() + timeout;
  let button = null;

  while (Date.now() < deadline) {
    button = findElement(selectors.sendButton);

    if (!button || !isElementVisible(button)) {
      button = null;
      await sleep(70);
      continue;
    }

    const ariaDisabled = button.getAttribute('aria-disabled');
    const isDisabled = button.disabled === true || ariaDisabled === 'true';

    if (!isDisabled) {
      return button;
    }

    await sleep(110);
  }

  if (!button) {
    button = await waitForElement(selectors.sendButton, 5000);
  }

  return button;
}

// 模拟用户输入
function simulateInput(element, text) {
  console.log('[PromptShooter] 开始填充内容，长度:', text.length);

  // 先激活 contenteditable（针对 Gemini）
  if (element.hasAttribute('contenteditable') && element.getAttribute('contenteditable') === 'false') {
    element.setAttribute('contenteditable', 'true');
  }

  // 点击元素以激活
  element.click();
  element.focus();

  // 对于 contenteditable 元素
  if (element.hasAttribute('contenteditable')) {
    // 检查是否是 Quill 编辑器（Gemini 使用）
    const isQuill = element.classList.contains('ql-editor');

    if (isQuill) {
      console.log('[PromptShooter] 检测到 Quill 编辑器，使用特殊处理');

      // 移除 ql-blank 类（表示编辑器为空）
      element.classList.remove('ql-blank');

      // 方法1: 使用 execCommand (兼容性好)
      element.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);

      console.log('[PromptShooter] Quill execCommand 完成');

      // 方法2: 如果 execCommand 不生效，使用 DOM 操作
      if (element.textContent !== text) {
        console.log('[PromptShooter] execCommand 失效，使用 DOM 方式');
        element.innerHTML = '';
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        element.appendChild(paragraph);
      }

      console.log('[PromptShooter] Quill 内容设置完成');
    } else {
      // 普通 contenteditable (ChatGPT / Claude)
      console.log('[PromptShooter] 处理普通 contenteditable 元素');

      // 清空内容
      element.innerHTML = '';

      // 创建段落元素并设置内容
      const p = document.createElement('p');
      p.textContent = text;
      element.appendChild(p);

      console.log('[PromptShooter] contenteditable 内容已设置');
    }

    console.log('[PromptShooter] 内容填充后 textContent:', element.textContent.substring(0, 100));
    console.log('[PromptShooter] 内容填充后 innerText:', element.innerText.substring(0, 100));

    // 触发 input 事件（不再逐字输入，避免长文本导致页面卡死）
    element.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    }));

    element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text
    }));

    element.dispatchEvent(new Event('change', { bubbles: true }));

    // 将光标移到末尾
    try {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (e) {
      console.warn('[PromptShooter] 光标设置失败:', e);
    }

    console.log('[PromptShooter] contenteditable 输入完成');
  }
  // 对于普通 input/textarea 元素
  else {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    ).set;

    nativeInputValueSetter.call(element, text);

    // 触发事件
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    console.log('[PromptShooter] textarea/input 输入完成，value:', element.value);
  }
}

// 模拟点击（派发 pointer/mouse 事件后再 click）
function simulateClick(element) {
  if (!element) {
    console.warn('[PromptShooter] simulateClick 收到无效元素');
    return;
  }

  element.scrollIntoView({ behavior: 'instant', block: 'center' });

  const rect = element.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;

  try {
    if (typeof PointerEvent === 'function') {
      element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, clientX, clientY }));
    }
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX, clientY }));
    if (typeof PointerEvent === 'function') {
      element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX, clientY }));
    }
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX, clientY }));
  } catch (error) {
    console.warn('[PromptShooter] 派发 pointer/mouse 事件失败，降级为直接 click:', error);
  }

  element.click();
}

// 填充并发送提示词
async function fillAndSendPrompt(prompt) {
  const selectors = getPlatformSelectors();

  console.log('[PromptShooter] 开始执行，当前URL:', window.location.href);
  console.log('[PromptShooter] Hostname:', window.location.hostname);
  console.log('[PromptShooter] 接收到的 prompt 长度:', prompt.length);
  console.log('[PromptShooter] 页面加载状态:', document.readyState);

  if (!selectors) {
    console.error('[PromptShooter] 当前页面不支持或无法识别平台');
    console.error('[PromptShooter] 支持的平台:', Object.keys(PLATFORM_SELECTORS));
    return;
  }

  if (document.readyState === 'loading') {
    console.log('[PromptShooter] 等待 DOMContentLoaded...');
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }

  console.log(`[PromptShooter-${selectors.name}] 平台识别成功`);
  console.log(`[PromptShooter-${selectors.name}] 输入框选择器:`, selectors.input);
  console.log(`[PromptShooter-${selectors.name}] 发送按钮选择器:`, selectors.sendButton);

  try {
    // 等待输入框出现
    console.log(`[PromptShooter-${selectors.name}] 等待输入框出现...`);
    const inputElement = await waitForElement(selectors.input);
    console.log(`[PromptShooter-${selectors.name}] ✅ 找到输入框:`, inputElement);

    // 填充提示词
    simulateInput(inputElement, prompt);
    console.log(`[PromptShooter-${selectors.name}] ✅ 已填充提示词`);

    // 查找并等待发送按钮可用
    console.log(`[PromptShooter-${selectors.name}] 查找发送按钮...`);
    let sendButton = await waitForSendButtonReady(selectors);
    console.log(`[PromptShooter-${selectors.name}] ✅ 发送按钮准备就绪:`, sendButton);

    const finalAriaDisabled = sendButton.getAttribute('aria-disabled');
    if (sendButton.disabled === true || finalAriaDisabled === 'true') {
      console.warn(`[PromptShooter-${selectors.name}] ⚠️ 发送按钮仍显示禁用状态，尝试激活...`);
      sendButton.removeAttribute('disabled');
      sendButton.disabled = false;
      sendButton.setAttribute('aria-disabled', 'false');
      await sleep(150);
    }

    console.log(`[PromptShooter-${selectors.name}] 点击发送按钮...`);
    sendButton.click();

    console.log(`[PromptShooter-${selectors.name}] ✅ 发送操作完成`);

    // 短暂等待确保操作完成
    await new Promise(resolve => setTimeout(resolve, 200));

  } catch (error) {
    console.error(`[PromptShooter-${selectors?.name || 'Unknown'}] ❌ 操作失败:`, error.message);
    console.error(`[PromptShooter-${selectors?.name || 'Unknown'}] 错误详情:`, error);
  }
}

// 创建模态弹窗
function createModal(modelName, platformName) {
  return new Promise((resolve) => {
    // 创建 Shadow DOM 容器
    const container = document.createElement('div');
    container.id = 'promptshooter-modal-container';
    document.body.appendChild(container);

    const shadowRoot = container.attachShadow({ mode: 'open' });

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
      .ps-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .ps-modal {
        background: white;
        border-radius: 16px;
        padding: 28px;
        max-width: 440px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
      }

      .ps-modal-icon {
        width: 48px;
        height: 48px;
        background: #fff3cd;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        font-size: 24px;
      }

      .ps-modal-title {
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 12px 0;
        text-align: center;
      }

      .ps-modal-message {
        font-size: 15px;
        color: #666;
        line-height: 1.6;
        margin: 0 0 24px 0;
        text-align: center;
      }

      .ps-modal-model-name {
        color: #e63946;
        font-weight: 600;
      }

      .ps-modal-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .ps-modal-button {
        padding: 12px 28px;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .ps-modal-button-confirm {
        background: #3498db;
        color: white;
      }

      .ps-modal-button-confirm:hover {
        background: #2980b9;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
      }

      .ps-modal-button-cancel {
        background: #e8e8e8;
        color: #666;
      }

      .ps-modal-button-cancel:hover {
        background: #d8d8d8;
      }
    `;

    const modalHTML = `
      <div class="ps-modal-overlay">
        <div class="ps-modal">
          <div class="ps-modal-icon">⚠️</div>
          <h2 class="ps-modal-title">模型不可用</h2>
          <p class="ps-modal-message">
            您选择的 <span class="ps-modal-model-name">${modelName}</span> 不可用。<br>
            将采用 ${platformName} 的默认模型。
          </p>
          <div class="ps-modal-buttons">
            <button class="ps-modal-button ps-modal-button-confirm">确认</button>
            <button class="ps-modal-button ps-modal-button-cancel">取消</button>
          </div>
        </div>
      </div>
    `;

    shadowRoot.appendChild(style);
    shadowRoot.innerHTML += modalHTML;

    const confirmBtn = shadowRoot.querySelector('.ps-modal-button-confirm');
    const cancelBtn = shadowRoot.querySelector('.ps-modal-button-cancel');
    const overlay = shadowRoot.querySelector('.ps-modal-overlay');

    const cleanup = (result) => {
      container.remove();
      resolve(result);
    };

    confirmBtn.addEventListener('click', () => cleanup(true));
    cancelBtn.addEventListener('click', () => cleanup(false));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup(false);
      }
    });

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handleEsc);
        cleanup(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

// 校验模型是否成功切换
async function verifyModelSwitch(expectedModel) {
  const hostname = window.location.hostname;

  console.log('[PromptShooter] 验证模型切换，期望模型:', expectedModel);

  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    if (hostname === 'chat.openai.com' || hostname === 'chatgpt.com') {
      let modelButton = document.querySelector('button[data-testid="model-switcher-dropdown-button"]');

      if (!modelButton) {
        const allButtons = Array.from(document.querySelectorAll('button'));
        for (const btn of allButtons) {
          const text = btn.textContent;
          if ((text.includes('ChatGPT 5') || textContainsAnyLabel(text, ALL_CHATGPT_MODEL_LABELS)) &&
              !text.includes('Send') && !text.includes('Stop') &&
              btn.offsetParent !== null) {
            modelButton = btn;
            break;
          }
        }
      }

      if (!modelButton) {
        console.warn('[PromptShooter] 验证失败：未找到模型按钮');
        return false;
      }

      const currentText = modelButton.textContent;
      const expectedLabels = getChatGPTModelAliases(expectedModel);
      const composerPill = document.querySelector('button.__composer-pill');
      const composerText = composerPill?.textContent || '';
      const isMatch = textContainsAnyLabel(currentText, expectedLabels);
      const composerMatch = textContainsAnyLabel(composerText, expectedLabels);

      console.log('[PromptShooter] ChatGPT 模型验证:', {
        current: currentText.substring(0, 50),
        composer: composerText.substring(0, 50),
        expected: expectedLabels,
        match: isMatch || composerMatch
      });

      if (isMatch || composerMatch) {
        return true;
      }

      console.warn('[PromptShooter] ChatGPT 模式校验未通过，current/composer:', currentText.trim(), '/', composerText.trim());
      return false;

    } else if (hostname === 'gemini.google.com') {
      const buttons = Array.from(document.querySelectorAll('button'));
      const modelButton = buttons.find(btn => {
        if (!isElementVisible(btn)) return false;
        const text = (btn.textContent || '').trim();
        return text.includes('2.5') || text.includes('Gemini');
      });

      if (!modelButton) {
        console.warn('[PromptShooter] Gemini 验证失败：未找到模型按钮');
        return false;
      }

      const targetLabels = getGeminiModelAliases(expectedModel);
      const expectedText = targetLabels[0] || expectedModel;
      const currentText = (modelButton.textContent || '').trim();

      // 初步匹配按钮文本
      const buttonMatch = textContainsAnyLabel(currentText, targetLabels);

      // 打开菜单检查 aria-checked 状态
      simulateClick(modelButton);
      await new Promise(resolve => setTimeout(resolve, 200));

      const rawItems = await getGeminiMenuItems();
      const menuItems = rawItems.map(item => ({
        element: item,
        text: (item.textContent || '').trim(),
        ariaChecked: item.getAttribute('aria-checked') || '',
        ariaDisabled: item.getAttribute('aria-disabled') || ''
      }));

      const matchingItem = menuItems.find(item => textContainsAnyLabel(item.text, targetLabels));

      if (!matchingItem) {
        console.warn('[PromptShooter] Gemini 验证失败：菜单中未找到目标模型');
        simulateClick(modelButton); // 尝试关闭菜单
        return false;
      }

      const menuMatch = matchingItem.ariaChecked === 'true';
      const isDisabled = matchingItem.ariaDisabled === 'true';

      console.log('[PromptShooter] Gemini 模型验证:', {
        buttonText: currentText,
        menuText: matchingItem.text,
        ariaChecked: matchingItem.ariaChecked,
        ariaDisabled: matchingItem.ariaDisabled,
        buttonMatch,
        menuMatch
      });

      // 关闭菜单
      simulateClick(modelButton);

      if (isDisabled) {
        console.warn('[PromptShooter] Gemini 模型被禁用，判定为切换失败');
        return false;
      }

      return buttonMatch && menuMatch;

    } else if (hostname === 'claude.ai') {
      const targetText = CLAUDE_MODEL_DISPLAY[expectedModel] || expectedModel;
      const dropdown = Array.from(document.querySelectorAll('button[data-testid="model-selector-dropdown"], button'))
        .find(btn => isElementVisible(btn) && (btn.textContent || '').includes(targetText));

      if (dropdown) {
        console.log('[PromptShooter] Claude 模型验证: 找到按钮文本', dropdown.textContent.trim());
        return true;
      }

      console.warn('[PromptShooter] Claude 模型验证失败：未找到包含目标模型的按钮');
      return false;
    }
  } catch (error) {
    console.error('[PromptShooter] 模型验证失败:', error);
    return false;
  }

  return true;
}

// 切换模型
async function switchModel(model, thinking) {
  const hostname = window.location.hostname;
  const selectors = getPlatformSelectors();
  console.log(`[PromptShooter] 开始切换模型: ${model}, Thinking: ${thinking}`);

  try {
    if (hostname === 'chat.openai.com' || hostname === 'chatgpt.com') {
      await switchChatGPTModel(model);
    } else if (hostname === 'gemini.google.com') {
      await switchGeminiModel(model);
    } else if (hostname === 'claude.ai') {
      await switchClaudeModel(model, thinking);
    }

    const isSuccess = await verifyModelSwitch(model);

    if (!isSuccess) {
      console.warn('[PromptShooter] 模型切换失败，显示提示弹窗');

      const modelDisplayName = MODEL_DISPLAY_NAMES[model] || model;
      const platformName = selectors?.name || '网站';

      const userConfirmed = await createModal(modelDisplayName, platformName);

      if (!userConfirmed) {
        console.log('[PromptShooter] 用户取消操作');
        throw new Error('用户取消操作');
      }

      console.log('[PromptShooter] 用户确认继续，尝试切换到默认模型');

      if (hostname === 'chat.openai.com' || hostname === 'chatgpt.com') {
        await switchChatGPTModel('gpt-5-insta');
      } else if (hostname === 'gemini.google.com') {
        await switchGeminiModel('2.5-flash');
      } else if (hostname === 'claude.ai') {
        await switchClaudeModel('sonnet-4.5', thinking);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('[PromptShooter] 已切换到默认模型');
    } else {
      console.log('[PromptShooter] 模型切换成功');
    }

  } catch (error) {
    console.error('[PromptShooter] 模型切换失败:', error);
    throw error;
  }
}

function findClaudeThinkingButton() {
  const candidates = Array.from(document.querySelectorAll('button[aria-pressed]'));
  for (const btn of candidates) {
    if (!isElementVisible(btn)) continue;
    const aria = (btn.getAttribute('aria-label') || '').trim();
    if (aria) continue;
    const path = btn.querySelector('svg path');
    if (path) {
      const d = path.getAttribute('d') || '';
      if (d.includes('10.3857') || d.includes('10.385')) {
        return btn;
      }
    }
  }
  const fallback = candidates.filter(btn => isElementVisible(btn) && !(btn.getAttribute('aria-label') || '').trim()).pop();
  if (fallback) {
    console.log('[PromptShooter-Claude] 使用回退思考按钮');
  }
  return fallback || null;
}

// 切换 ChatGPT 模型（点击顶部下拉菜单）
async function switchChatGPTModel(model) {
  console.log('[PromptShooter-ChatGPT] 开始切换模型到:', model);

  const targetLabels = getChatGPTModelAliases(model);

  for (let attempt = 0; attempt < 8; attempt++) {
    const headerButton = Array.from(document.querySelectorAll('button[data-testid="model-switcher-dropdown-button"]'))
      .find(btn => btn.offsetParent !== null);
    const headerText = (headerButton?.textContent || '').trim();
    const pillButton = Array.from(document.querySelectorAll('button.__composer-pill'))
      .find(btn => btn.offsetParent !== null);
    const pillText = (pillButton?.textContent || '').trim();

    const isTargetActive = targetLabels.some(label =>
      headerText.includes(label) || pillText.includes(label)
    );

    if (isTargetActive) {
      console.log('[PromptShooter-ChatGPT] ✅ 已经是目标模型，无需切换');
      return;
    }

    if (!headerButton) {
      console.warn('[PromptShooter-ChatGPT] 未找到顶部模型按钮，再尝试一次');
      await new Promise(resolve => setTimeout(resolve, 300));
      continue;
    }

    console.log('[PromptShooter-ChatGPT] 点击顶部模型下拉按钮');
    simulateClick(headerButton);

    let menuContainer = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      menuContainer = Array.from(document.querySelectorAll('[role="menu"], [role="listbox"]'))
        .find(el => el.offsetParent !== null);
      if (menuContainer) break;
    }

    if (!menuContainer) {
      console.warn('[PromptShooter-ChatGPT] 未找到菜单容器，继续尝试');
      await new Promise(resolve => setTimeout(resolve, 200));
      continue;
    }

    const menuItems = Array.from(menuContainer.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [data-testid]'))
      .filter(el => el.offsetParent !== null);
    console.log('[PromptShooter-ChatGPT] 菜单项数量:', menuItems.length);

    const targetTestId = CHATGPT_MODEL_TEST_IDS[model];
    if (targetTestId) {
      const testIdItem = menuItems.find(el => el.getAttribute('data-testid') === targetTestId);
      if (testIdItem) {
        console.log('[PromptShooter-ChatGPT] ✅ 通过 data-testid 找到模型:', targetTestId);
        simulateClick(testIdItem);
        await new Promise(resolve => setTimeout(resolve, 800));
        return;
      }
    }

    for (const item of menuItems) {
      const itemText = (item.textContent || '').trim();
      if (textContainsAnyLabel(itemText, targetLabels)) {
        console.log('[PromptShooter-ChatGPT] ✅ 通过文本匹配到模型，点击:', itemText.substring(0, 80));
        simulateClick(item);
        await new Promise(resolve => setTimeout(resolve, 800));
        return;
      }
    }

    console.warn('[PromptShooter-ChatGPT] 没找到匹配的菜单项，关闭菜单重试');
    document.body.click();
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  const labelSummary = targetLabels.join(' / ') || model;
  throw new Error(`未找到模型选项: ${labelSummary}`);
}

// 切换 Gemini 模型
async function switchGeminiModel(model) {
  console.log('[PromptShooter-Gemini] 切换模型到:', model);

  let modelButton = null;
  const allButtons = document.querySelectorAll('button');

  for (const btn of allButtons) {
    const text = btn.textContent.trim();
    if ((text.includes('2.5') || text.includes('Gemini')) &&
        (text.includes('Pro') || text.includes('Flash')) &&
        btn.offsetParent !== null) {
      modelButton = btn;
      console.log('[PromptShooter-Gemini] 找到模型按钮:', text);
      break;
    }
  }

  if (!modelButton) {
    console.warn('[PromptShooter-Gemini] 未找到模型选择按钮');
    return;
  }

  simulateClick(modelButton);
  console.log('[PromptShooter-Gemini] 已点击模型按钮，等待菜单加载...');

  await new Promise(resolve => setTimeout(resolve, 300));

  const targetLabels = getGeminiModelAliases(model);
  const modelText = targetLabels[0] || model;
  console.log('[PromptShooter-Gemini] 查找模型选项:', targetLabels);

  const menuItems = await getGeminiMenuItems();

  console.log(`[PromptShooter-Gemini] 找到 ${menuItems.length} 个可见菜单项`);

  for (const item of menuItems) {
    const itemText = item.textContent.trim();
    console.log(`[PromptShooter-Gemini] 检查菜单项: "${itemText}"`);

    if (textContainsAnyLabel(itemText, targetLabels)) {
      console.log(`[PromptShooter-Gemini] ✅ 找到匹配项，点击: ${itemText}`);
      simulateClick(item);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }
  }

  console.warn(`[PromptShooter-Gemini] ❌ 未找到模型选项: ${modelText}`);
  console.warn('[PromptShooter-Gemini] 所有菜单项:', menuItems.map(i => i.textContent.trim()));
  document.body.click();
}

// 切换 Claude 模型
async function switchClaudeModel(model, thinking) {
  console.log('[PromptShooter-Claude] 切换模型到:', model, 'Thinking:', thinking);

  const targetLabel = CLAUDE_MODEL_DISPLAY[model] || model;

  let dropdown = Array.from(document.querySelectorAll('button[data-testid="model-selector-dropdown"]'))
    .find(isElementVisible);

  if (!dropdown) {
    dropdown = Array.from(document.querySelectorAll('button'))
      .find(btn => isElementVisible(btn) && (btn.textContent || '').includes(targetLabel));
  }

  if (!dropdown) {
    console.warn('[PromptShooter-Claude] 未找到模型选择按钮');
  } else {
    console.log('[PromptShooter-Claude] 点击模型下拉按钮');
    simulateClick(dropdown);
    await new Promise(resolve => setTimeout(resolve, 400));
  }

  let menuOption = null;
  const visibleDivs = Array.from(document.querySelectorAll('div'))
    .filter(el => isElementVisible(el) && (el.className || '').includes('cursor-pointer'));

  for (const div of visibleDivs) {
    const text = (div.textContent || '').trim();
    if (!text) continue;
    if (text.includes(targetLabel)) {
      menuOption = div;
      break;
    }
  }

  if (menuOption) {
    console.log('[PromptShooter-Claude] 选择模型选项:', (menuOption.textContent || '').trim().slice(0, 80));
    simulateClick(menuOption);
    await new Promise(resolve => setTimeout(resolve, 600));
  } else {
    console.warn('[PromptShooter-Claude] 未找到模型选项:', targetLabel);
  }

  if (thinking !== undefined) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const thinkingButton = findClaudeThinkingButton();
    if (thinkingButton) {
      const isThinkingEnabled = thinkingButton.getAttribute('aria-pressed') === 'true';
      if (thinking !== isThinkingEnabled) {
        console.log(`[PromptShooter-Claude] 切换 Thinking 模式到: ${thinking}`);
        simulateClick(thinkingButton);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } else {
      console.warn('[PromptShooter-Claude] 未找到 Thinking 切换按钮');
    }
  }
}

// 监听来自 background.js 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillAndSend') {
    (async () => {
      try {
        console.log('[PromptShooter] 收到消息，准备填充并发送');
        console.log('[PromptShooter] Prompt 长度:', message.prompt.length);
        console.log('[PromptShooter] 请求的模型:', message.model);

        if (message.model) {
          try {
            await switchModel(message.model, message.thinking);
          } catch (error) {
            if (error.message === '用户取消操作') {
              console.log('[PromptShooter] 用户取消，停止执行');
              sendResponse({ success: false, error: '用户取消操作' });
              return;
            }
            console.warn('[PromptShooter] 模型切换失败，继续使用当前模型:', error);
          }
        }

        await fillAndSendPrompt(message.prompt);
        console.log('[PromptShooter] 操作完成');
        sendResponse({ success: true });
      } catch (error) {
        console.error('[PromptShooter] 执行失败:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
});

console.log('PromptShooter content script loaded');
