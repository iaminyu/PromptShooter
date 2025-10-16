// 平台配置
const PLATFORMS = {
  chatgpt: {
    url: 'https://chatgpt.com',
    urlPattern: '*://chatgpt.com/*'
  },
  gemini: {
    url: 'https://gemini.google.com',
    urlPattern: '*://gemini.google.com/*'
  },
  claude: {
    url: 'https://claude.ai/chats',
    urlPattern: '*://claude.ai/*'
  }
};

const MESSAGE_RETRY_INTERVAL = 90;
const MESSAGE_RETRY_TIMEOUT = 4500;

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendPrompt') {
    handleSendPrompt(message.prompt, message.platformConfigs);
    sendResponse({ success: true });
  }
  return true;
});

// 处理发送提示词
async function handleSendPrompt(prompt, platformConfigs) {
  // 创建新窗口
  const newWindow = await chrome.windows.create({
    focused: true,
    state: 'normal'
  });

  const initialTabs = await chrome.tabs.query({ windowId: newWindow.id });
  const baseTab = initialTabs[0];

  const tabTasks = [];

  // 在新窗口中为每个平台创建标签页
  for (let i = 0; i < platformConfigs.length; i++) {
    const config = platformConfigs[i];
    const platform = PLATFORMS[config.platform];
    if (!platform) continue;

    try {
      let tab;
      if (i === 0) {
        if (baseTab) {
          tab = await chrome.tabs.update(baseTab.id, { url: platform.url, active: true });
        } else {
          tab = await chrome.tabs.create({
            windowId: newWindow.id,
            url: platform.url,
            active: true
          });
        }
      } else {
        tab = await chrome.tabs.create({
          windowId: newWindow.id,
          url: platform.url,
          active: false
        });
      }

      const task = sendToPlatform(tab, prompt, config).catch(error => {
        console.error(`发送到 ${config.platform} 失败:`, error);
      });
      tabTasks.push(task);
    } catch (error) {
      console.error(`发送到 ${config.platform} 失败:`, error);
    }
  }

  await Promise.all(tabTasks);
}

// 发送到指定平台
async function sendToPlatform(tab, prompt, config) {
  console.log(`[Background] 开始发送到平台: ${config.platform}, Tab ID: ${tab.id}`);

  // 等待标签页加载完成
  await waitForTabLoad(tab.id);
  console.log(`[Background] 标签页加载完成: ${tab.id}`);

  // 注入并执行内容脚本
  try {
    console.log(`[Background] 开始注入 content.js 到 Tab ${tab.id}`);
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    console.log(`[Background] content.js 注入成功`);

    console.log(`[Background] 发送消息到 Tab ${tab.id}:`, {
      action: 'fillAndSend',
      prompt: prompt.substring(0, 50) + '...',
      model: config.model,
      thinking: config.thinking
    });

    const response = await sendMessageWithRetry(tab.id, {
      action: 'fillAndSend',
      prompt,
      model: config.model,
      thinking: config.thinking
    });

    console.log(`[Background] 收到响应:`, response);
  } catch (error) {
    console.error(`[Background] 执行内容脚本失败 (Tab ${tab.id}):`, error);
    console.error('[Background] 错误详情:', error.message, error.stack);
  }
}

// 等待标签页加载完成
function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (tab.status === 'complete') {
        resolve();
      } else {
        // 监听标签页更新
        const listener = (updatedTabId, changeInfo) => {
          if (updatedTabId === tabId && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);

        // 设置超时，防止无限等待
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }, 30000);
      }
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessageWithRetry(tabId, payload) {
  const start = Date.now();
  let lastErrorMessage = '';

  while (Date.now() - start < MESSAGE_RETRY_TIMEOUT) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, payload);
      return response;
    } catch (error) {
      lastErrorMessage = error?.message || String(error);
      await sleep(MESSAGE_RETRY_INTERVAL);
    }
  }

  throw new Error(`发送消息失败: ${lastErrorMessage || 'unknown error'} (timeout ${MESSAGE_RETRY_TIMEOUT}ms)`);
}
