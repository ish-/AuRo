import {
  Storage,
  log,
} from './utils.js';

// drop all tabs settings after last browser boot
(async function dropStorageTabsKeys () {
  const items = await Storage.getAll();
  const tabKeys = Object.keys(items)
    .filter(key => key.startsWith('tab_'));
  log('storage tab keys droped', await Storage.remove(tabKeys));
})()

chrome.runtime.onMessage.addListener((msg, sender) => {
  const fn = msgs[msg.name];
  if (fn)
    fn(msg, sender);
});

const msgs = {
  async ['content:init'] ({ frameId }, sender) {
    const { tab } = sender;
    // 'all' and 'host' options is not implemented yet
    // const url = new URL(tab.url);
    const tabKey = `tab_${ tab.id }`;
    // const allKey = 'all';
    // const hostKey = `host_${ url.host }`;
    const res = await Storage.getSome([ tabKey/*, allKey, hostKey*/ ]);
    const tabDeviceId = res[tabKey];
    // const hostDeviceId = res[hostKey];
    // const allDeviceId = res[allKey];

    const deviceId = /*allDeviceId || hostDeviceId || */tabDeviceId || null;
    // const target = allDeviceId ? 'all' : hostDeviceId ? 'host' : tabDeviceId ? 'tab' : null;
    log('content:init', { frameId }, sender, '->', deviceId);

    chrome.tabs.sendMessage(tab.id, {
      name: 'content:init:resp',
      deviceId,
      // target,
      tabId: tab.id,
      frameId,
    });

    updatePopupIconText({ tabId: tab.id, deviceId });
  },

  ['updatePopupIconText'] ({ deviceId }, sender) {
    updatePopupIconText({
      deviceId,
      tabId: sender.tab.id,
    });
  },

  ['updatePopupIconTheme'] ({ isDark }) {
    chrome.browserAction.setIcon({
      path: isDark ? 'Icon128-white.png' : 'Icon128.png',
    });
  }
};

function updatePopupIconText ({ tabId, deviceId }) {
  chrome.browserAction.setBadgeText({
    tabId,
    text: (!deviceId || deviceId === 'default') ? '' : 'Ω',
  });
}
