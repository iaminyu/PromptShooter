const promptInput = document.getElementById('prompt-input');
const sendButton = document.getElementById('send-button');
const platformSummary = document.getElementById('platform-summary');
const platformCheckboxes = Array.from(document.querySelectorAll('[data-platform-checkbox]'));
const selectedLabels = {
  chatgpt: document.querySelector('[data-selected-label="chatgpt"]'),
  gemini: document.querySelector('[data-selected-label="gemini"]'),
  claude: document.querySelector('[data-selected-label="claude"]')
};
const openSettingsBtn = document.getElementById('open-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const claudeThinkingToggle = document.getElementById('claude-default-thinking');

const settingsRadios = {
  chatgpt: Array.from(document.querySelectorAll('input[name="chatgpt-default"]')),
  gemini: Array.from(document.querySelectorAll('input[name="gemini-default"]')),
  claude: Array.from(document.querySelectorAll('input[name="claude-default"]'))
};

const STORAGE_KEYS = {
  platforms: 'selectedPlatforms',
  models: 'selectedModels',
  defaults: 'defaultModels',
  defaultThinking: 'defaultClaudeThinking'
};

const PLATFORM_ORDER = ['chatgpt', 'gemini', 'claude'];
const MODEL_LABEL_MAP = {
  'gpt-5-thinking': 'GPT-5 Thinking',
  'gpt-5-insta': 'GPT-5 Instant',
  '2.5-flash': 'Gemini 2.5 Flash',
  '2.5-pro': 'Gemini 2.5 Pro',
  'sonnet-4.5': 'Sonnet 4.5',
  'opus-4.1': 'Opus 4.1'
};

let defaultModels = {
  chatgpt: 'gpt-5-thinking',
  gemini: '2.5-flash',
  claude: 'sonnet-4.5'
};
let defaultClaudeThinking = true;

function updateSummaryLabel(platform) {
  const label = selectedLabels[platform];
  if (!label) return;
  let display = MODEL_LABEL_MAP[defaultModels[platform]] || defaultModels[platform];
  if (platform === 'claude' && defaultClaudeThinking) {
    display += ' + extended thinking';
  }
  label.textContent = display;
}

function updateAllSummaryLabels() {
  PLATFORM_ORDER.forEach(updateSummaryLabel);
}

function isPlatformChecked(platform) {
  const checkbox = platformCheckboxes.find(cb => cb.value === platform);
  return checkbox ? checkbox.checked : false;
}

function updateSummaryText() {
  const selectedCount = platformCheckboxes.filter(cb => cb.checked).length;
  platformSummary.textContent = `已选 ${selectedCount} 个平台 · 将打开 ${selectedCount} 个标签页`;
}

function updateSendButtonState() {
  const hasPrompt = promptInput.value.trim().length > 0;
  const hasPlatform = platformCheckboxes.some(cb => cb.checked);
  sendButton.disabled = !(hasPrompt && hasPlatform);
}

function toggleScreen(target) {
  ['main-screen', 'settings-screen'].forEach(id => {
    document.getElementById(id).classList.toggle('hidden', id !== target);
  });
}

async function loadSettings() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.platforms,
    STORAGE_KEYS.defaults,
    STORAGE_KEYS.defaultThinking
  ]);

  if (data[STORAGE_KEYS.defaults]) {
    defaultModels = { ...defaultModels, ...data[STORAGE_KEYS.defaults] };
  }
  if (typeof data[STORAGE_KEYS.defaultThinking] === 'boolean') {
    defaultClaudeThinking = data[STORAGE_KEYS.defaultThinking];
  }

  PLATFORM_ORDER.forEach(platform => {
    const radios = settingsRadios[platform];
    const defaultValue = defaultModels[platform];
    const radio = radios.find(r => r.value === defaultValue) || radios[0];
    if (radio) radio.checked = true;
  });
  claudeThinkingToggle.checked = defaultClaudeThinking;

  const storedPlatforms = data[STORAGE_KEYS.platforms] || ['chatgpt'];
  platformCheckboxes.forEach(cb => {
    cb.checked = storedPlatforms.includes(cb.value);
  });

  updateAllSummaryLabels();
  updateSummaryText();
  updateSendButtonState();
}

async function savePlatformSelection() {
  const selected = platformCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
  await chrome.storage.local.set({ [STORAGE_KEYS.platforms]: selected });
}

async function saveDefaultState() {
  const defaults = {};
  PLATFORM_ORDER.forEach(platform => {
    const checked = settingsRadios[platform].find(r => r.checked);
    if (checked) defaults[platform] = checked.value;
  });
  defaultModels = { ...defaultModels, ...defaults };
  defaultClaudeThinking = claudeThinkingToggle.checked;
  await chrome.storage.local.set({
    [STORAGE_KEYS.defaults]: defaultModels,
    [STORAGE_KEYS.defaultThinking]: defaultClaudeThinking
  });
  updateAllSummaryLabels();
}

async function handleSend() {
  const prompt = promptInput.value.trim();
  if (!prompt) return;
  const selectedPlatforms = platformCheckboxes.filter(cb => cb.checked).map(cb => cb.value);
  if (selectedPlatforms.length === 0) return;
  const configs = selectedPlatforms.map(platform => ({
    platform,
    model: defaultModels[platform],
    thinking: platform === 'claude' ? defaultClaudeThinking : undefined
  }));
  sendButton.disabled = true;
  const original = sendButton.textContent;
  sendButton.textContent = '发送中...';
  try {
    await chrome.runtime.sendMessage({ action: 'sendPrompt', prompt, platformConfigs: configs });
    setTimeout(() => window.close(), 400);
  } catch (error) {
    console.error('发送失败:', error);
    sendButton.disabled = false;
    sendButton.textContent = original;
  }
}

function bindEvents() {
  promptInput.addEventListener('input', updateSendButtonState);
  platformCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      updateSummaryText();
      updateSendButtonState();
      savePlatformSelection();
    });
  });
  saveSettingsBtn.addEventListener('click', async () => {
    await saveDefaultState();
    toggleScreen('main-screen');
  });
  openSettingsBtn.addEventListener('click', () => toggleScreen('settings-screen'));
  closeSettingsBtn.addEventListener('click', () => toggleScreen('main-screen'));
  sendButton.addEventListener('click', handleSend);
}

(async function init() {
  await loadSettings();
  updateAllSummaryLabels();
  bindEvents();
})();
