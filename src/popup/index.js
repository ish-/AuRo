import { auro } from '../lib';

const gotTab = (async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
})();

function drawDeviceList (devices, targets, tab) {
  const { host } = new URL(tab.url);
  let currentDeviceId = targets.deviceId;

  auro.logging.log('drawDeviceList', { devices });

  const $devices = document.querySelector('#devices');
  $devices.innerHTML = '';

  const $setForHost = document.querySelector('#set-for-host');
  let hostDeviceId = targets.hostDeviceId;
  $setForHost.disabled = hostDeviceId === currentDeviceId;
  $setForHost.addEventListener('click', onSetForHostClick);

  async function onSetForHostClick () {
    hostDeviceId = currentDeviceId;
    await auro.events.extension.upgradeTabOutputDeviceToHost({ tabId: tab.id, deviceId: currentDeviceId, host });
    $setForHost.disabled = true;
  }

  devices.forEach(device => {
    const labelId = `sinkId-${ device.deviceId }`;
    const $device = document.createElement('li');
    $device.className = device.deviceId === 'default' ? '--default' : '';

    const $input = document.createElement('input');
    $input.name = 'sinkId';
    $input.type = 'radio';
    $input.id = labelId;
    $input.checked = currentDeviceId === device.deviceId
      || (!currentDeviceId && device.deviceId === 'default');
    $input.value = device.deviceId;

    $device.append($input);

    const $label = document.createElement('label');
    $label.htmlFor = labelId;
    $label.textContent = device.label;

    $device.append($label);

    $devices.append($device);
  });

  async function onDeviceSelect (e) {
    const { value: deviceId } = e.target;
    currentDeviceId = deviceId;
    if (e.target.name === 'sinkId') {
      const tab = await gotTab;
      await auro.events.extension.setTabOutputDevice({ tabId: tab.id, deviceId: deviceId });
      $setForHost.disabled = false;
    }
  }

  window.removeEventListener('input', onDeviceSelect);
  window.addEventListener('input', onDeviceSelect);
  document.body.classList.add('--allow');
}

window.addEventListener('load', () => {
  setTimeout(async () => {
    const tab = await gotTab;

    const { devices, targets } = await auro.events.tabs.getMediaState(tab.id);

    auro.logging.log('load', devices, targets);
    if (devices.length !== 0) {
      drawDeviceList(devices, targets, tab);
    }
  });
});

