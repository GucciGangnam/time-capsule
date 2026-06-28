// Tiny cross-route signal: the create screen lives in a separate (modal) route,
// so focus effects on the AR screen don't reliably fire on dismiss. After a post
// is created we emit here, and the AR feed refetches.
type Listener = () => void;

const listeners = new Set<Listener>();

export function onPostsChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitPostsChanged(): void {
  listeners.forEach((listener) => listener());
}
