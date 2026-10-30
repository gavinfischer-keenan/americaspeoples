/** Small bounded cache for a changing selection, not a fire-and-forget queue.
 * At most two loads run. A new desired key supersedes queued work, but it is
 * always drained after either success or failure; stale failures never own UI. */
export class LatestRequestCache<T> {
  private values = new Map<string, T>();
  private running = new Set<string>();
  private failures = new Map<string, number>();
  private desired: string | null = null;
  private listeners = new Set<() => void>();
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  constructor(
    private load: (key: string) => Promise<T>,
    private maxEntries = 8,
    private concurrency = 2,
    private retryMs = 30000,
  ) {}
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  get(key: string) {
    return this.values.get(key);
  }
  seed(key: string, value: T) {
    this.values.set(key, value);
  }
  state(): "idle" | "ready" | "loading" | "error" {
    return this.desired === null
      ? "idle"
      : this.values.has(this.desired)
        ? "ready"
        : (this.failures.get(this.desired) ?? 0) > Date.now()
          ? "error"
          : "loading";
  }
  request(key: string | null) {
    const changed = key !== this.desired;
    this.desired = key;
    if (changed) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    this.drain();
  }
  dispose() {
    this.desired = null;
    clearTimeout(this.retryTimer);
    this.listeners.clear();
  }
  private notify() {
    for (const listener of this.listeners) listener();
  }
  private drain() {
    const key = this.desired;
    if (!key || this.values.has(key) || this.running.has(key)) return;
    const wait = (this.failures.get(key) ?? 0) - Date.now();
    if (wait > 0) {
      if (!this.retryTimer)
        this.retryTimer = setTimeout(() => {
          this.retryTimer = undefined;
          this.drain();
          this.notify();
        }, wait + 1);
      return;
    }
    if (this.running.size >= this.concurrency) return;
    this.running.add(key);
    void this.load(key)
      .then((value) => {
        this.values.set(key, value);
        this.failures.delete(key);
        while (this.values.size > this.maxEntries) {
          const oldest = this.values.keys().next().value!;
          if (oldest === this.desired) {
            const keep = this.values.get(oldest)!;
            this.values.delete(oldest);
            this.values.set(oldest, keep);
          } else this.values.delete(oldest);
        }
      })
      .catch(() => {
        this.failures.set(key, Date.now() + this.retryMs);
      })
      .finally(() => {
        this.running.delete(key);
        this.drain();
        this.notify();
      });
  }
}
