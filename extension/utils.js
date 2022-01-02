export function getEl (selector) {
  return document.querySelector(selector);
}

export function getEls (selector) {
  return [...document.querySelectorAll(selector)];
}

export function createEl (tag, props, children) {
  const $el = document.createElement(tag);
  if (props)
    Object.entries(props).forEach(([name, val]) => {
      if (name === 'style')
        return Object.assign($el.style, val);
      $el[name] = val;
    });
  if (children)
    children.forEach($child => $el.append($child));
  return $el;
}

export function filterOutputDevices (devices) {
  return devices.filter(({ kind }) => kind === 'audiooutput')
}

export function log (desc, ...args) {
  if (!args.length && typeof desc === 'string')
    return (...args) => log(desc, ...args);
  console.log('AuRo :: ', desc, ...args);
  return args[0];
}

export const Storage = {
  getAll () {
    return this.getSome(null);
  },

  get (key) {
    return new Promise (rslv => chrome.storage.local.get(key, res => rslv(res[key] || null)));
  },

  getSome (keys) {
    return new Promise (rslv => chrome.storage.local.get(keys, rslv));
  },

  set (payload) {
    return new Promise(rslv => chrome.storage.local.set(payload, rslv));
  },

  remove (keys) {
    return new Promise(rslv => chrome.storage.local.remove(keys, rslv));
  },

  _listening: false,
  _listeners: {},
  listen (key, callback) {
    if (!this._listening) {
      chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
          const listener = this._listeners[key];
          if (listener)
            listen(newValue, oldValue, changes, namespace);
        }
      });
      this._listening = true;
    }

    this._listeners[key] = callback;
  }
}

export const nextTick = setTimeout;
