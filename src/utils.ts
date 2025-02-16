export const shuffler = <T>(unshuffled: T[]) => {
  return unshuffled
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

export const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

export const indexToCoords = (index: number, cols: number) => {
  const y = Math.floor(index / cols);
  const x = index % cols;
  return { x, y };
};

export const onClick = (
  el: HTMLElement,
  cb: (eventType?: "longPress" | "keyup" | "keydown", e?: MouseEvent) => void,
  duration = 1000
) => {
  let timer = 0;
  let isTouching = false;
  let isLongPressedReleased = false;
  el.addEventListener("touchstart", () => {
    isTouching = true;
    timer = setTimeout(() => {
      cb("longPress");
      isLongPressedReleased = true;
      isTouching = false;
    }, duration);
  });
  el.addEventListener("touchend", () => {
    isTouching = false;
    clearTimeout(timer);
  });
  el.addEventListener("touchcancel", () => {
    isTouching = false;
    clearTimeout(timer);
  });
  el.addEventListener("mouseup", (e) => {
    cb("keyup", e);
  });
  el.addEventListener("mousedown", (e) => {
    if (!isLongPressedReleased && !isTouching) {
      cb("keydown", e);
    }
    isLongPressedReleased = false;
  });

  return () =>
    ["click", "touchstart", "touchend", "touchcancel"].forEach((e) =>
      el.removeEventListener(e, () => cb())
    );
};
