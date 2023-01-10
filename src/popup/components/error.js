import { createElement } from "../renderer.js";

export function error (message) {
  return () => createElement('p', null, [ message ]);
}
