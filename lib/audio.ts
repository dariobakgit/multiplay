"use client";

/**
 * Audio manager — plays MP3 files from /sounds/.
 * If a file is missing or fails to load, the corresponding sound is
 * silently skipped.
 *
 * Expected files (see public/sounds/README.md):
 *   /sounds/menu.mp3   (loop)
 *   /sounds/game.mp3   (loop)
 *   /sounds/win.mp3    (one-shot)
 *   /sounds/lose.mp3   (one-shot)
 */

type Track = "menu" | "game" | "fnf";
type Sfx = "win" | "lose";
type Key = Track | Sfx;

const FILES: Record<Key, { path: string; loop: boolean; volume: number }> = {
  menu: { path: "/sounds/menu.mp3", loop: true, volume: 0.45 },
  game: { path: "/sounds/game.mp3", loop: true, volume: 0.45 },
  fnf: { path: "/sounds/fnf.mp3", loop: true, volume: 0.5 },
  win: { path: "/sounds/win.mp3", loop: false, volume: 0.8 },
  lose: { path: "/sounds/lose.mp3", loop: false, volume: 0.7 },
};

const MUTE_KEY = "multiply-mute";

class AudioManager {
  private elements: Partial<Record<Key, HTMLAudioElement>> = {};
  private currentTrack: Track | null = null;
  private muted = false;
  private unlocked = false;
  private pendingTrack: Track | null = null;
  private listenersAttached = false;

  init() {
    if (typeof window === "undefined") return;
    this.muted = window.localStorage.getItem(MUTE_KEY) === "1";
    this.attachUnlockListeners();
    this.preloadFiles();
  }

  isMuted() {
    return this.muted;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    }
    if (m) this.stopMusic();
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  playMusic(track: Track) {
    if (this.muted) return;
    if (!this.unlocked) {
      this.pendingTrack = track;
      return;
    }
    if (this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;
    const el = this.elements[track];
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {
      // Autoplay/load failed — skip silently.
    });
  }

  stopMusic() {
    this.pendingTrack = null;
    this.currentTrack = null;
    // Pause every looping track (music) dynamically — no hardcoded list so
    // new tracks don't get left playing.
    for (const key of Object.keys(FILES) as Key[]) {
      if (!FILES[key].loop) continue;
      const el = this.elements[key];
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
    }
  }

  stopSfx() {
    for (const key of Object.keys(FILES) as Key[]) {
      if (FILES[key].loop) continue;
      const el = this.elements[key];
      if (el && !el.paused) {
        el.pause();
        el.currentTime = 0;
      }
    }
  }

  /** Stops music AND any in-flight SFX. Use at screen unmounts. */
  stopAll() {
    this.stopMusic();
    this.stopSfx();
  }

  playSfx(sfx: Sfx) {
    if (this.muted || !this.unlocked) return;
    const el = this.elements[sfx];
    if (!el) return;
    // Ensure no other SFX is still playing before starting this one.
    this.stopSfx();
    el.currentTime = 0;
    el.play().catch(() => {
      // Ignore playback errors.
    });
  }

  // ---- internals ----

  private preloadFiles() {
    (Object.keys(FILES) as Key[]).forEach((key) => {
      if (this.elements[key]) return;
      const cfg = FILES[key];
      const el = new Audio(cfg.path);
      el.preload = "auto";
      el.loop = cfg.loop;
      el.volume = cfg.volume;
      this.elements[key] = el;
    });
  }

  private attachUnlockListeners() {
    if (this.listenersAttached) return;
    this.listenersAttached = true;
    const handler = () => {
      this.unlocked = true;
      if (this.pendingTrack) {
        const t = this.pendingTrack;
        this.pendingTrack = null;
        this.playMusic(t);
      }
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
    window.addEventListener("pointerdown", handler);
    window.addEventListener("keydown", handler);
  }
}

export const audio = new AudioManager();
