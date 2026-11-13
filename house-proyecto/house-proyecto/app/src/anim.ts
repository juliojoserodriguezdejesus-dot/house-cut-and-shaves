import { Easing, cubicBezier } from "react-native-reanimated";

export const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);       // entrada fuerte
export const EASE_IN_OUT = cubicBezier(0.77, 0, 0.175, 1);   // movimiento en pantalla

/** Entrada de un elemento. Con "reducir movimiento" solo hace fade. */
export function enter(reduced: boolean, delay: number, o: { y?: number; scale?: number; dur?: number } = {}) {
  const { y = 14, scale = 0.95, dur = 0.6 } = o;
  return {
    animationName: reduced
      ? { from: { opacity: 0 }, to: { opacity: 1 } }
      : {
          from: { opacity: 0, transform: [{ translateY: y }, { scale }] },
          to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
        },
    animationDuration: `${dur}s`,
    animationDelay: `${delay}s`,
    animationTimingFunction: EASE_OUT,
    animationFillMode: "both",
  } as const;
}

/** Misma curva ease-in-out, pero para withTiming (shared values). */
export const EASE_IN_OUT_WT = Easing.bezier(0.77, 0, 0.175, 1);
export const EASE_OUT_WT = Easing.bezier(0.23, 1, 0.32, 1);
