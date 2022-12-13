import { createElement } from "../renderer.js";

export function pending () {
  return () => [
    createElement('p', null, [
      createElement('em', null, ['Allow']),
      ' audio access for the current domain to enable functionality.',
    ]),
    createElement('p', null, [
      'You might not get prompted for permissions if it is explicitly blocked by your browser\'s settings.',
    ]),
  ];
}
