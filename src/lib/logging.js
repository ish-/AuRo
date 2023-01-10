import { getFrameDepth } from "./dom";

function getPrefixes () {
  return [__log_namespace__, `[${ getFrameDepth() }]`];
}

export function log (...args) {
  if (__log_verbose__) {
    console.log(...getPrefixes(), ...args);
  }
}

export function warn (...args) {
  console.warn(...getPrefixes(), ...args);
}

export function error (...args) {
  console.error(...getPrefixes(), ...args);
}
