import {auro} from '../lib';
import {main, updateOutputDevice} from "./injectable";

function isDefaultDeviceId (deviceId) {
  return !deviceId || deviceId === 'default';
}

async function onOutputDeviceChanged (tabId, deviceId) {
  try {
    // Inject the main AuRo machinery in the page when necessary
    if (!isDefaultDeviceId(deviceId) && !await auro.events.tabs.getInitialized(tabId)) {
      // Preload the auro library
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        world: 'MAIN',
        files: [ 'lib.js' ],
      });
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        world: 'MAIN',
        func: main,
      });
      await auro.events.tabs.setInitialized(tabId);
    }

    // Trigger a device sink update in AuRo
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      world: 'MAIN',
      func: updateOutputDevice,
      args: [ isDefaultDeviceId(deviceId) ? '' : deviceId ]
    });

    // Update the UI
    await chrome.action.setBadgeText({
      tabId,
      text: isDefaultDeviceId(deviceId) ? '' : 'Ω',
    });
  } catch (err) {
    if (err.message === 'The extensions gallery cannot be scripted.') {
      auro.logging.log('No script can run on the extension gallery.');
      return;
    }

    auro.logging.error(err);
  }
}

function senderToTargetKeys (sender) {
  return {
    tabId: sender.tab.id,
    hostId: new URL(sender.tab.url).host,
  };
}

async function getTargets (tabId, hostId) {
  const tabDeviceId = await auro.storage.tabs.getTarget(tabId);
  const hostDeviceId = await auro.storage.hosts.getTarget(hostId);
  // const allDeviceId = response[allKey];

  const deviceId = /*allDeviceId || */tabDeviceId || hostDeviceId || null;
  // const target = allDeviceId ? 'all' : hostDeviceId ? 'host' : tabDeviceId ? 'tab' : null;

  return { deviceId, hostDeviceId, tabDeviceId };
}

auro.events.extension.getTargets.on((_, sender) => {
  const { tabId, hostId } = senderToTargetKeys(sender);
  return getTargets(tabId, hostId);
});
auro.events.extension.restoreLastOutputDevice.on(async (_, sender) => {
  const { tabId, hostId } = senderToTargetKeys(sender);

  const targets = await getTargets(tabId, hostId);
  await onOutputDeviceChanged(tabId, targets.deviceId);
});
auro.events.extension.setTheme.on(({ isDark }) =>
  chrome.action.setIcon({
    path: isDark ? 'Icon128-white.png' : 'Icon128.png',
  })
);
auro.events.extension.setTabOutputDevice.on(async ({ tabId, deviceId }) => {
  await auro.storage.tabs.setTarget(tabId, deviceId);
  await onOutputDeviceChanged(tabId, deviceId);
});
auro.events.extension.upgradeTabOutputDeviceToHost.on(async ({ tabId, deviceId, host }) => {
  await auro.storage.hosts.setTarget(host, deviceId)
  await auro.storage.tabs.removeTarget(tabId);
  await onOutputDeviceChanged(tabId, deviceId);
});
