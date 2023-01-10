export function getFrameDepth (wnd) {
  if (!wnd) {
    if (typeof window === 'undefined') {
      return -1;
    }

    wnd = window;
  }

  return wnd.parent === wnd ? 0 : 1 + getFrameDepth(wnd.parent);
}
