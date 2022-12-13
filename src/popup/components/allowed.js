import { auro } from "../../lib/index.js";

import { createElement, requestRender } from "../renderer.js";

function deviceInput (device, currentDeviceId, onChange) {
  const { deviceId, label } = device;
  const id = `sinkId-${ deviceId }`;
  const isDefault = deviceId === 'default';

  return () => createElement('li', { className: `device ${ isDefault ? 'default' : '' }` }, [
    createElement('input', {
      id,
      name: 'sinkId',
      type: 'radio',
      className: 'device-input',
      checked: currentDeviceId ? currentDeviceId === deviceId : isDefault,
      value: deviceId,
      input: onChange,
    }),
    createElement('label', { htmlFor: id }, [ label ]),
  ]);
}

export function allowed (devices, targets, tab) {
  auro.logging.log('allowed', devices, targets, tab);

  const { host } = new URL(tab.url);
  let currentDeviceId = targets.deviceId;
  let hostDeviceId = targets.hostDeviceId;

  async function saveHost () {
    hostDeviceId = currentDeviceId;
    await auro.events.extension.upgradeTabOutputDeviceToHost({ tabId: tab.id, deviceId: currentDeviceId, host });

    requestRender();
  }

  async function changeDevice (e) {
    const { value: deviceId } = e.target;

    currentDeviceId = deviceId;
    await auro.events.extension.setTabOutputDevice({ tabId: tab.id, deviceId: deviceId });

    requestRender();
  }

  return () => createElement('div', { className: 'allowed' }, [
    createElement('h2', { className: 'heading' }, [
      'Pick the output device for this tab:',
      createElement(
        'button',
        {
          className: 'button button-primary save-host',
          disabled: hostDeviceId === currentDeviceId,
          click: saveHost,
        },
        [ 'Save for this domain', ]
      ),
    ]),
    createElement('ul', { className: 'devices' }, devices
      .map(d => deviceInput(d, currentDeviceId, changeDevice))
    ),
    createElement('p', { className: 'tip' }, [
      'You might need to pause/play media or reload the page.',
      createElement('br'),
      'Switching will not work for interactive sites using AudioContext.',
    ]),
  ]);
}
