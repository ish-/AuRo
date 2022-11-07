import {log} from "./logging.js";

function makeEvent (name, tabs) {
  function sendRuntime (message) {
    log('sending message', name, message);
    return chrome.runtime.sendMessage({ name, ...message });
  }
  function sendTab (tabId, message) {
    log('sending message', tabId, name, message);
    return chrome.tabs.sendMessage(tabId, { name, ...message });
  }

  const send = function (...args) {
    if (tabs) {
      return sendTab(...args);
    } else {
      return sendRuntime(...args);
    }
  };

  send.on = function onMessage (callback) {
    chrome.runtime.onMessage
      .addListener((message, sender, sendResponse) => {
        if (message.name === name) {
          log('on message', message, sender);

          const result = callback(message, sender);

          function autoForward (response) {
            if (typeof response === 'undefined') {
              return sendResponse();
            }

            log('replying to', message, 'with', response);
            return sendResponse(response);
          }

          if (result?.then) {
            result.then(autoForward);
            return true;
          }

          autoForward(result);
        }
      });
  }

  return send;
}

export const extension = {
  getTargets: makeEvent('auro:getTargets'),
  restoreLastOutputDevice: makeEvent('auro:restoreLastOutputDevice'),
  setTheme: makeEvent('auro:setTheme'),
  setTabOutputDevice: makeEvent('auro:setTabOutputDevice'),
  upgradeTabOutputDeviceToHost: makeEvent('auro:upgradeTabOutputDeviceToHost'),
};

export const tabs = {
  setInitialized: makeEvent('auro:setInitialized', true),
  getInitialized: makeEvent('auro:getInitialized', true),
  getMediaState: makeEvent('auro:getMediaState', true),
};
