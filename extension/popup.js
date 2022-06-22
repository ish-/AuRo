import {
  createEl,
  getEl,
  getEls,
  log,
  filterOutputDevices,
  Storage,
  nextTick,
} from './utils.js';

let host;
// incoming msgs
// chrome.runtime.onMessage.addListener((msg, sender, send) => {
//   log('onMessage', { msg, sender });

//   switch (msg.name) {
//     case 'popup:requestTabMedia:resp':
//       log('popup:requestTabMedia:resp', msg.devices);
//       drawDeviceList(msg.devices);
//   }
// });

const inputName = 'sinkId';

function drawDeviceList (devices, targets, tab) {
  let currentDeviceId = targets.deviceId;
  log('drawDeviceList', { devices });
  const $devices = getEl('#devices');
  $devices.innerHTML = '';

  const $setForHost = getEl('#set-for-host');
  let hostDeviceId = targets.hostDeviceId;
  $setForHost.disabled = hostDeviceId === currentDeviceId;
  $setForHost.addEventListener('click', onSetForHostClick);

  function onSetForHostClick (e) {
    hostDeviceId = currentDeviceId;
    Storage.set({ [`host_${ host }`]: currentDeviceId });
    Storage.remove([ `tab_${ tab.id }` ]);
    $setForHost.disabled = true;
  }


  filterOutputDevices(devices)
    .forEach(device => {
      const labelId = `${ inputName }-${ device.deviceId }`;
      const $device = createEl('li', {
        className: device.deviceId === 'default' ? '--default' : '',
      }, [
        createEl('input', {
          name: inputName,
          type: 'radio',
          id: labelId,
          checked: currentDeviceId === device.deviceId
            || (!currentDeviceId && device.deviceId === 'default'),
          value: device.deviceId,
        }),
        createEl('label', {
          htmlFor: labelId,
          textContent: device.label
        }),
      ]);

      $devices.append($device);
    });

  function onDeviceSelect (e) {
    const { name, value: deviceId } = e.target;
    currentDeviceId = deviceId;
    if (e.target.name === inputName) {
      gotTab.then(tab => {
        Storage.set({ [`tab_${ tab.id }`]: deviceId });
      })
      $setForHost.disabled = false;
      // Content.setTabOutputDevice(currentDeviceId);
    }
  }

  window.removeEventListener('input', onDeviceSelect);
  window.addEventListener('input', onDeviceSelect);
  document.body.classList.add('--allow');

  return devices;
}

// it doesnt work \wo contentSettings permission, doesnt metter
// function getDevices () {
//   return navigator.mediaDevices.enumerateDevices().then(log('getDevices()'));
// }

const gotTab = (() => {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => resolve(tabs[0]));
  })
})();

window.addEventListener('load', e => {
  // getEl('#reload').addEventListener('click', e => chrome.runtime.reload());

  // nextTick(async () => {
  //   const devices = await getDevices();
  //   drawDeviceList(devices);
  //   getEls('#devices input[type="radio"]').forEach($radio => { $radio.disabled = true })
  // });

  nextTick(async () => {
    const tab = await gotTab;
    host = (new URL(tab.url)).host;
    const { devices, targets } = await Content.getState();
    drawDeviceList(devices, targets, tab);
  });
});

const Content = {
  getState () {
    return this.askCurrentTab({ name: 'popup:getState' })
  },

  // setTabOutputDevice (deviceId) {
  //   return this.sendToCurrentTab({ name: 'popup:setTabOutputDevice', deviceId })
  //     .then(log('setTabOutputDevice().answer'));
  // },

  // requestTabMedia () {
  //   return this.sendToCurrentTab({ name: 'popup:requestTabMedia' })
  //     .then(log('mediaState'));
  // },

  sendToCurrentTab (msg) {
    return new Promise((r, j) => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, msg, resp => {
          if (resp && resp.error)
            return j(resp.error)
          return r(resp);
        });
      });
    });
  },

  askCurrentTab (msg) {
    return new Promise((r, j) => {
      return gotTab.then(currentTab => {
        msg.id = Date.now();
        chrome.tabs.sendMessage(currentTab.id, msg);
        const cb = (respMsg, sender) => {
          log(respMsg.name + ' response: ')(respMsg);
          if (respMsg.id === msg.id) {
            chrome.runtime.onMessage.removeListener(cb);
            r(respMsg);
          }
        };
        chrome.runtime.onMessage.addListener(cb);
      });
    });
  }
}
