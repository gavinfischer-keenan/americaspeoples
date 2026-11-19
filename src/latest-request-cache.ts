/** Small bounded cache for a changing selection, not a fire-and-forget queue.
 * At most two loads run. A new desired key supersedes queued work, but it is
 * always drained after either success or failure; stale failures never own UI. */
export class LatestRequestCache<T> {
  private values = new Map<string, T>();
  private running = new Set<string>();
  private failures = new Map<string, number>();
  private required: string[] = [];
  private optional: string[] = [];
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
    return !this.required.length
      ? "idle"
      : this.required.every(key=>this.values.has(key))
        ? "ready"
        : this.required.some(key=>!this.values.has(key)&&(this.failures.get(key)??0)>Date.now())
          ? "error"
          : "loading";
  }
  request(key: string | null) {
    this.requestGroup(key?[key]:[]);
  }
  requestGroup(required:string[],optional:string[]=[]){
    const changed=JSON.stringify([required,optional])!==JSON.stringify([this.required,this.optional]);
    this.required=[...new Set(required)];this.optional=[...new Set(optional)].filter(key=>!this.required.includes(key)).slice(0,Math.max(0,this.maxEntries-this.required.length));
    if (changed) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
    this.drain();
  }
  dispose() {
    this.required=[];this.optional=[];
    clearTimeout(this.retryTimer);
    this.listeners.clear();
  }
  private notify() {
    for (const listener of this.listeners) listener();
  }
  private drain() {
    for(const key of [...this.required,...this.optional]){
    if (this.values.has(key) || this.running.has(key)) continue;
    const wait = (this.failures.get(key) ?? 0) - Date.now();
    if (wait > 0) {
      if (!this.retryTimer)
        this.retryTimer = setTimeout(() => {
          this.retryTimer = undefined;
          this.drain();
          this.notify();
        }, wait + 1);
      continue;
    }
    if (this.running.size >= this.concurrency) return;
    this.running.add(key);
    void this.load(key)
      .then((value) => {
        this.values.set(key, value);
        this.failures.delete(key);
        while (this.values.size > this.maxEntries) {
          const oldest=[...this.values.keys()].find(candidate=>!this.required.includes(candidate)&&!this.optional.includes(candidate));
          if(oldest===undefined)break;
          this.values.delete(oldest);
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
}
