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
const languageSelect = document.getElementById('language-select');

const settingsRadios = {
  chatgpt: Array.from(document.querySelectorAll('input[name="chatgpt-default"]')),
  gemini: Array.from(document.querySelectorAll('input[name="gemini-default"]')),
  claude: Array.from(document.querySelectorAll('input[name="claude-default"]'))
};

const STORAGE_KEYS = {
  platforms: 'selectedPlatforms',
  models: 'selectedModels',
  defaults: 'defaultModels',
  defaultThinking: 'defaultClaudeThinking',
  language: 'preferredLanguage'
};

const FALLBACK_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'ja', 'ko', 'es', 'de', 'fr', 'pt-BR'];
const LANGUAGE_NAMES = {
  en: 'English',
  'zh-CN': '简体中文',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  'pt-BR': 'Português (Brasil)'
};

const TRANSLATIONS = {
  en: {
    main: {
      subtitle: 'Send the same prompt to multiple platforms at once',
      sectionTitle: 'Select platforms & models',
      editDefaults: 'Modify default models >',
      send: 'Send to all',
      sending: 'Sending...',
      summary: 'Selected {selected} platform(s) · Will open {tabs} tab(s)'
    },
    prompt: {
      placeholder: 'Enter your prompt here...'
    },
    settings: {
      back: 'Back',
      title: 'Settings',
      subtitle: 'Configure default models',
      save: 'Save',
      languageLabel: 'Interface language',
      languageHint: 'Defaults to your browser language when available.'
    },
    claude: {
      extendedThinkingLabel: 'Extended thinking',
      extendedThinkingSuffix: ' + extended thinking'
    }
  },
  'zh-CN': {
    main: {
      subtitle: '一键把同一提示词发送到多个平台',
      sectionTitle: '选择平台和模型',
      editDefaults: '修改默认模型>',
      send: '一键发送',
      sending: '发送中...',
      summary: '已选 {selected} 个平台 · 将打开 {tabs} 个标签页'
    },
    prompt: {
      placeholder: '在此输入你的提示词……'
    },
    settings: {
      back: '返回',
      title: '设置',
      subtitle: '配置默认模型',
      save: '保存',
      languageLabel: '界面语言',
      languageHint: '默认跟随浏览器语言，若不支持则使用英文。'
    },
    claude: {
      extendedThinkingLabel: '扩展思考',
      extendedThinkingSuffix: ' + 扩展思考'
    }
  },
  ja: {
    main: {
      subtitle: '同じプロンプトを複数プラットフォームへ一括送信',
      sectionTitle: 'プラットフォームとモデルを選択',
      editDefaults: 'デフォルトモデルを編集 >',
      send: '一括送信',
      sending: '送信中...',
      summary: '選択 {selected} 件 · {tabs} 件のタブを開きます'
    },
    prompt: {
      placeholder: 'ここにプロンプトを入力してください...'
    },
    settings: {
      back: '戻る',
      title: '設定',
      subtitle: 'デフォルトモデルを設定',
      save: '保存',
      languageLabel: '表示言語',
      languageHint: '利用可能な場合はブラウザの言語に従います。'
    },
    claude: {
      extendedThinkingLabel: '拡張思考',
      extendedThinkingSuffix: ' + 拡張思考'
    }
  },
  ko: {
    main: {
      subtitle: '하나의 프롬프트를 여러 플랫폼에 한 번에 전송',
      sectionTitle: '플랫폼과 모델 선택',
      editDefaults: '기본 모델 수정 >',
      send: '한 번에 보내기',
      sending: '보내는 중...',
      summary: '플랫폼 {selected}개 선택 · 탭 {tabs}개를 엽니다'
    },
    prompt: {
      placeholder: '여기에 프롬프트를 입력하세요...'
    },
    settings: {
      back: '뒤로',
      title: '설정',
      subtitle: '기본 모델 구성',
      save: '저장',
      languageLabel: '인터페이스 언어',
      languageHint: '가능한 경우 브라우저 언어를 따릅니다.'
    },
    claude: {
      extendedThinkingLabel: '확장 사고',
      extendedThinkingSuffix: ' + 확장 사고'
    }
  },
  es: {
    main: {
      subtitle: 'Envía el mismo prompt a varias plataformas a la vez',
      sectionTitle: 'Selecciona plataformas y modelos',
      editDefaults: 'Modificar modelos predeterminados >',
      send: 'Enviar a todos',
      sending: 'Enviando...',
      summary: '{selected} plataformas seleccionadas · Se abrirán {tabs} pestañas'
    },
    prompt: {
      placeholder: 'Escribe tu prompt aquí...'
    },
    settings: {
      back: 'Volver',
      title: 'Configuración',
      subtitle: 'Configura los modelos predeterminados',
      save: 'Guardar',
      languageLabel: 'Idioma de la interfaz',
      languageHint: 'Usa el idioma del navegador cuando está disponible.'
    },
    claude: {
      extendedThinkingLabel: 'Pensamiento extendido',
      extendedThinkingSuffix: ' + pensamiento extendido'
    }
  },
  de: {
    main: {
      subtitle: 'Sende denselben Prompt gleichzeitig an mehrere Plattformen',
      sectionTitle: 'Plattformen und Modelle auswählen',
      editDefaults: 'Standardmodelle ändern >',
      send: 'An alle senden',
      sending: 'Senden...',
      summary: '{selected} Plattform(en) ausgewählt · Öffnet {tabs} Tab(s)'
    },
    prompt: {
      placeholder: 'Prompt hier eingeben...'
    },
    settings: {
      back: 'Zurück',
      title: 'Einstellungen',
      subtitle: 'Standardmodelle konfigurieren',
      save: 'Speichern',
      languageLabel: 'Anzeigesprache',
      languageHint: 'Verwendet nach Möglichkeit die Sprache deines Browsers.'
    },
    claude: {
      extendedThinkingLabel: 'Erweitertes Denken',
      extendedThinkingSuffix: ' + erweitertes Denken'
    }
  },
  fr: {
    main: {
      subtitle: 'Envoyez le même prompt vers plusieurs plateformes en un clic',
      sectionTitle: 'Choisir les plateformes et modèles',
      editDefaults: 'Modifier les modèles par défaut >',
      send: 'Envoyer à tous',
      sending: 'Envoi en cours...',
      summary: '{selected} plateforme(s) sélectionnée(s) · {tabs} onglet(s) seront ouverts'
    },
    prompt: {
      placeholder: 'Saisissez votre prompt ici...'
    },
    settings: {
      back: 'Retour',
      title: 'Paramètres',
      subtitle: 'Configurer les modèles par défaut',
      save: 'Enregistrer',
      languageLabel: "Langue de l'interface",
      languageHint: 'Suit la langue du navigateur lorsqu\'elle est disponible.'
    },
    claude: {
      extendedThinkingLabel: 'Réflexion étendue',
      extendedThinkingSuffix: ' + réflexion étendue'
    }
  },
  'pt-BR': {
    main: {
      subtitle: 'Envie o mesmo prompt para várias plataformas de uma vez',
      sectionTitle: 'Escolha plataformas e modelos',
      editDefaults: 'Modificar modelos padrão >',
      send: 'Enviar para todos',
      sending: 'Enviando...',
      summary: '{selected} plataforma(s) selecionada(s) · {tabs} guia(s) serão abertas'
    },
    prompt: {
      placeholder: 'Digite seu prompt aqui...'
    },
    settings: {
      back: 'Voltar',
      title: 'Configurações',
      subtitle: 'Defina os modelos padrão',
      save: 'Salvar',
      languageLabel: 'Idioma da interface',
      languageHint: 'Usa o idioma do navegador quando disponível.'
    },
    claude: {
      extendedThinkingLabel: 'Raciocínio estendido',
      extendedThinkingSuffix: ' + raciocínio estendido'
    }
  }
};

let currentLanguage = FALLBACK_LANGUAGE;

function normalizeLanguage(code) {
  if (!code || typeof code !== 'string') return FALLBACK_LANGUAGE;
  const lower = code.toLowerCase();
  const exact = SUPPORTED_LANGUAGES.find(lang => lang.toLowerCase() === lower);
  if (exact) return exact;
  const base = lower.split('-')[0];
  const baseMatch = SUPPORTED_LANGUAGES.find(lang => lang.toLowerCase().startsWith(base));
  return baseMatch || FALLBACK_LANGUAGE;
}

function detectSystemLanguage() {
  try {
    if (chrome?.i18n?.getUILanguage) {
      return normalizeLanguage(chrome.i18n.getUILanguage());
    }
  } catch (error) {
    console.warn('Failed to detect Chrome UI language:', error);
  }
  return normalizeLanguage(navigator.language);
}

function getNestedTranslation(lang, key) {
  return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), TRANSLATIONS[lang]);
}

function t(key, replacements = {}) {
  const candidates = [currentLanguage, FALLBACK_LANGUAGE];
  let template;
  for (const lang of candidates) {
    template = getNestedTranslation(lang, key);
    if (typeof template === 'string') break;
  }
  if (typeof template !== 'string') return key;
  return Object.entries(replacements).reduce(
    (acc, [token, value]) => acc.replace(new RegExp(`\\{${token}\\}`, 'g'), value),
    template
  );
}

function translateElement(node) {
  const key = node.getAttribute('data-i18n-key');
  if (!key) return;
  const attr = node.getAttribute('data-i18n-attr');
  const text = t(key);
  if (attr) {
    node.setAttribute(attr, text);
  } else {
    node.textContent = text;
  }
}

function populateLanguageOptions() {
  if (!languageSelect) return;
  languageSelect.innerHTML = '';
  SUPPORTED_LANGUAGES.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = LANGUAGE_NAMES[lang] || lang;
    languageSelect.appendChild(option);
  });
  languageSelect.value = currentLanguage;
  languageSelect.setAttribute('aria-label', t('settings.languageLabel'));
}

function setSendButtonDefaultText() {
  if (!sendButton) return;
  sendButton.textContent = t('main.send');
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n-key]').forEach(translateElement);
  populateLanguageOptions();
  setSendButtonDefaultText();
  updateAllSummaryLabels();
  updateSummaryText();
}

async function setLanguage(langCode, options = {}) {
  const normalized = normalizeLanguage(langCode);
  currentLanguage = normalized;
  document.documentElement.setAttribute('lang', normalized);
  if (options.persist !== false) {
    await chrome.storage.local.set({ [STORAGE_KEYS.language]: normalized });
  }
  if (options.apply !== false) {
    applyTranslations();
  }
}

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
    display += t('claude.extendedThinkingSuffix');
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
  platformSummary.textContent = t('main.summary', {
    selected: selectedCount,
    tabs: selectedCount
  });
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
    STORAGE_KEYS.defaultThinking,
    STORAGE_KEYS.language
  ]);

  const storedLanguage = data[STORAGE_KEYS.language];
  const detectedLanguage = detectSystemLanguage();
  await setLanguage(storedLanguage || detectedLanguage, { persist: false, apply: false });

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
    [STORAGE_KEYS.defaultThinking]: defaultClaudeThinking,
    [STORAGE_KEYS.language]: currentLanguage
  });
  updateAllSummaryLabels();
  updateSummaryText();
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
  const sendingText = t('main.sending');
  sendButton.textContent = sendingText;
  try {
    await chrome.runtime.sendMessage({ action: 'sendPrompt', prompt, platformConfigs: configs });
    setTimeout(() => window.close(), 400);
  } catch (error) {
    console.error('Send failed:', error);
    sendButton.disabled = false;
    setSendButtonDefaultText();
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
  openSettingsBtn.addEventListener('click', (event) => {
    event.preventDefault();
    toggleScreen('settings-screen');
  });
  closeSettingsBtn.addEventListener('click', () => toggleScreen('main-screen'));
  sendButton.addEventListener('click', handleSend);
  if (languageSelect) {
    languageSelect.addEventListener('change', (event) => {
      setLanguage(event.target.value).catch(error => {
        console.error('Failed to update language:', error);
      });
    });
  }
}

(async function init() {
  await loadSettings();
  applyTranslations();
  bindEvents();
})();
