import { auro } from "../../lib/index.js";

import { createElement, requestRender } from "../renderer.js";

import { pending } from "./pending.js";
import { allowed } from "./allowed.js";
import { error } from "./error.js";
import { more } from "./more.js";

export function shell () {
  let page = pending();

  setTimeout(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    try {
      const { devices, targets } = await auro.events.tabs.getMediaState(tab.id);

      if (devices.length !== 0) {
        page = allowed(devices, targets, tab);
      }
    } catch (e) {
      // This can happen if the popup is triggered on system tabs.
      // No content script can run on these pages so the connection isn't opened.
      if (`${e}`.includes('Receiving end does not exist.')) {
        page = error('This page does not allow extensions.');
      } else {
        throw e;
      }
    } finally {
      requestRender();
    }
  });

  return () => createElement('div', { className: 'shell' }, [
    createElement('div', { className: 'main' }, [ page ]),
    more(),
  ]);
}
