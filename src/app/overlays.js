// Things drawn over the slide (Notes drawer, menus, hotspot cards) that must close before the story
// moves: while one is open, Next/Back/Escape close it and do nothing else (FR-019, research P6).

const overlays = [];

/** Registers an overlay: `isOpen()` reports state, `close()` closes it. Later registrations close first. */
export function register(name, { isOpen, close }) {
  overlays.push({ name, isOpen, close });
}

export function anyOpen() {
  return overlays.some((o) => o.isOpen());
}

/** Closes the most recently registered open overlay. Returns true if one was closed. */
export function closeTop() {
  for (let i = overlays.length - 1; i >= 0; i--) {
    if (overlays[i].isOpen()) {
      overlays[i].close();
      return true;
    }
  }
  return false;
}

/** Closes the named overlay if it is open. Returns true if it was. */
export function closeIfOpen(name) {
  const o = overlays.find((x) => x.name === name);
  if (!o?.isOpen()) return false;
  o.close();
  return true;
}

export function closeAll() {
  for (const o of overlays) if (o.isOpen()) o.close();
}
