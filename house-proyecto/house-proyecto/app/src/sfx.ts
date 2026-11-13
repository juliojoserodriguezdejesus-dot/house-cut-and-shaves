import { createAudioPlayer, AudioPlayer } from "expo-audio";

const SRC = {
  swish: require("../assets/sounds/swish.wav"), whoosh: require("../assets/sounds/whoosh.wav"),
  ting: require("../assets/sounds/ting.wav"), thud: require("../assets/sounds/thud.wav"),
  drop: require("../assets/sounds/drop.wav"), shimmer: require("../assets/sounds/shimmer.wav"),
  roll: require("../assets/sounds/roll.wav"), snip: require("../assets/sounds/snip2.wav"),
} as const;
export type Sfx = keyof typeof SRC;

let muted = false, last = 0;
const cache: Partial<Record<Sfx, AudioPlayer>> = {};
export const setMuted = (m: boolean) => { muted = m; };
export const isMuted = () => muted;
const get = (n: Sfx) => (cache[n] ??= createAudioPlayer(SRC[n]));
export function preloadSfx() { (Object.keys(SRC) as Sfx[]).forEach((n) => { try { get(n); } catch {} }); }

/** Un efecto puntual. Sin `force`, ignora disparos a menos de 140 ms del anterior. */
export function sfx(name: Sfx, volume = 1, force = false) {
  const now = Date.now();
  if (muted || (!force && now - last < 140)) return;
  last = now;
  try { const p = get(name); p.volume = volume; p.seekTo(0); p.play(); } catch {}
}
export const later = (ms: number, name: Sfx, volume = 1) => setTimeout(() => sfx(name, volume, true), ms);
