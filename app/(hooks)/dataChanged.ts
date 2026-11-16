import * as React from "react";

// Screens that load data outside SWR (the events calendar asks FullCalendar to
// fetch) cannot be revalidated with SWR's mutate. When something else changes
// data on the server (the assistant running a confirmed action), it announces
// it here and those screens reload.
const EVENT = "srtomy:data-changed";

export const notifyDataChanged = () =>
  globalThis.dispatchEvent(new Event(EVENT));

// Calls `reload` every time `notifyDataChanged` is called while mounted.
export const useOnDataChanged = (reload: () => void) => {
  const latest = React.useRef(reload);
  React.useEffect(() => {
    latest.current = reload;
  }, [reload]);
  React.useEffect(() => {
    const listener = () => latest.current();
    globalThis.addEventListener(EVENT, listener);
    return () => globalThis.removeEventListener(EVENT, listener);
  }, []);
};
