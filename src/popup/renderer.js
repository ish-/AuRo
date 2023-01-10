import {auro} from "../lib/index.js";

export function requestRender () {
  auro.logging.log('Rendering requested.');
  document.dispatchEvent(new CustomEvent('requestRender'));
}

function isEvent (prop) {
  return typeof prop[1] === 'function';
}
export function createElement (type, props, children) {
  const entries = Object.entries(props || {});
  const attrs = entries.filter(p => !isEvent(p));
  const events = entries.filter(isEvent);

  const el = document.createElement(type);

  Object.assign(el, Object.fromEntries(attrs));
  for (const event of events) {
    auro.logging.log('Listening for', event[0], 'on', type);
    el.addEventListener(event[0], event[1]);
  }

  if (Array.isArray(children) && children.length) {
    const rendered = children
      .map(child => typeof child === 'function' ? child() : child)
      .flatMap(child => Array.isArray(child) ? child : [child]);
    el.replaceChildren(...rendered);
  }

  return el;
}

export function render (renderFn) {
  const root = document.getElementsByTagName('body')[0];
  document.addEventListener('requestRender', () => {
    auro.logging.log('Rendering...');
    root.replaceChildren(renderFn());
  });

  requestRender(root);
}
