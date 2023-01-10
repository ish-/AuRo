import { createElement } from "../renderer.js";

export function more () {
  return () => createElement('div', { className: 'more' }, [
    createElement('a', { href: 'https://chrome.google.com/webstore/detail/auro-audio-output-device/hglnindfakmbhhkldompfjeknfapaceh', target: '_blank' }, ['Feedback']),
    createElement('a', { href: 'https://github.com/ish-/AuRo/issues', target: '_blank' }, ['Report bug']),
  ]);
}
