import {
	Storage,
	log,
} from './utils.js';

var extensionId = chrome.runtime.id;

chrome.contentSettings['microphone'].set({'primaryPattern':'*://' + extensionId + '/*','setting':'allow'});

chrome.runtime.onMessage.addListener((msg, sender) => {
  const fn = msgs[msg.name];
  if (fn)
  	fn(msg, sender);
});

const msgs = {
	async ['content:init'] ({ frameId }, sender) {
		log('content:init', { frameId }, sender);
		const { tab } = sender;
		const url = new URL(tab.url);
		const allKey = 'all';
		const tabKey = `tab_${ tab.id }`;
		const hostKey = `host_${ url.host }`;
		// all and host is not implemented yet
		const res = await Storage.getSome([ allKey, tabKey, hostKey ]);
		const hostDeviceId = res[hostKey];
		const tabDeviceId = res[tabKey];
		const allDeviceId = res[allKey];

		const deviceId = allDeviceId || hostDeviceId || tabDeviceId || null;
		const target = allDeviceId ? 'all' : hostDeviceId ? 'host' : tabDeviceId ? 'tab' : null;

    chrome.tabs.sendMessage(tab.id, {
    	name: 'content:init:resp',
    	deviceId,
    	target,
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
