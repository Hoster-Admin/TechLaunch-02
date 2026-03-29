type Listener = () => void;

const listeners: Set<Listener> = new Set();

export const authEvents = {
  onUnauthorized(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emitUnauthorized() {
    listeners.forEach((l) => l());
  },
};
