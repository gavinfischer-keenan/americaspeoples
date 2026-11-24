/**
 * One play/pause engine for every timeline player (Americas movie, Europe,
 * Africa/Asia human-family player, topic movies).
 *
 * It owns what was previously re-implemented four times: the playing flag, the
 * requestAnimationFrame loop with a clamped frame step, the speed multiplier,
 * the play button's visible label and accessible name, the container's
 * `is-playing` class, pausing when the tab is hidden, and cleanup. Each page
 * keeps its own notion of "advance by dt" in `onAdvance`.
 */
export interface PlaybackLabels {
  /** Accessible name while paused, e.g. "Play" or "Play topic". */
  play: string;
  /** Accessible name while playing, e.g. "Pause" or "Pause topic". */
  pause: string;
}

export interface PlaybackOptions {
  button: HTMLElement;
  labels?: PlaybackLabels;
  /** Receives the `is-playing` class while playing. */
  container?: Element | null;
  /** Called every animation frame while playing, with the frame step in ms,
   *  already clamped to `maxFrameMs` and multiplied by the current rate.
   *  Omit it when the page drives its own frame loop (see `externalFrames`). */
  onAdvance?(stepMs: number, now: number): void;
  /** The page runs its own always-on frame loop and only needs the shared
   *  play/pause state, labels, container class and hidden-tab pause. */
  externalFrames?: boolean;
  /** Runs before playback starts; return false to cancel starting. */
  beforePlay?(): boolean | void;
  /** Runs after every play/pause transition. */
  onChange?(playing: boolean): void;
  /** Longest frame step passed to onAdvance (default 250 ms), so a background
   *  tab or a slow frame never jumps the timeline. */
  maxFrameMs?: number;
}

/** Visible labels are the same on every player; only accessible names vary. */
export const PLAY_TEXT = '▶ Play';
export const PAUSE_TEXT = 'Ⅱ Pause';

export class PlaybackController {
  playing = false;
  rate = 1;
  private frame = 0;
  private last = 0;
  private disposed = false;
  private readonly labels: PlaybackLabels;
  private readonly maxFrameMs: number;
  private readonly visibility = () => { if (document.hidden) this.pause(); };

  constructor(private readonly options: PlaybackOptions) {
    this.labels = options.labels ?? {play: 'Play', pause: 'Pause'};
    this.maxFrameMs = options.maxFrameMs ?? 250;
    document.addEventListener('visibilitychange', this.visibility);
    this.render();
  }

  play(): void {
    if (this.disposed || this.playing) return;
    if (this.options.beforePlay?.() === false) return;
    this.playing = true;
    this.last = performance.now();
    this.render();
    if (!this.options.externalFrames) this.frame = requestAnimationFrame(this.tick);
    this.options.onChange?.(true);
  }

  pause(): void {
    if (this.disposed) return;
    const wasPlaying = this.playing;
    this.playing = false;
    cancelAnimationFrame(this.frame);
    this.render();
    if (wasPlaying) this.options.onChange?.(false);
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  dispose(): void {
    this.playing = false;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    document.removeEventListener('visibilitychange', this.visibility);
  }

  private readonly tick = (now: number) => {
    if (this.disposed || !this.playing) return;
    const step = Math.min(this.maxFrameMs, Math.max(0, now - this.last));
    this.last = now;
    this.options.onAdvance?.(step * this.rate, now);
    if (this.playing) this.frame = requestAnimationFrame(this.tick);
  };

  private render(): void {
    const {button, container} = this.options;
    button.textContent = this.playing ? PAUSE_TEXT : PLAY_TEXT;
    button.setAttribute('aria-label', this.playing ? this.labels.pause : this.labels.play);
    container?.classList.toggle('is-playing', this.playing);
  }
}
