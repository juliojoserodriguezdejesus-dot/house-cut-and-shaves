import React, { createContext, useContext } from "react";
import { LayoutChangeEvent } from "react-native";
import Animated, { Easing, SharedValue, useAnimatedReaction, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { EASE_OUT_WT } from "../anim";
import { Sfx, sfx as playSfx } from "../sfx";

export const ScrollCtx = createContext<{ y: SharedValue<number>; vh: number; offset: number }>(null as never);

/** Progreso 0→1 que arranca una sola vez cuando la sección sube al 90 % de la pantalla (hilo de UI). */
export function useReveal(duration: number, onShow?: () => void) {
  const { y, vh, offset } = useContext(ScrollCtx);
  const reduced = useReducedMotion();
  const top = useSharedValue(1e6), p = useSharedValue(0);
  useAnimatedReaction(() => y.get() + vh * 0.9 > top.get(), (v, prev) => {
    if (v && !prev) {
      p.set(reduced ? 1 : withTiming(1, { duration, easing: Easing.linear }));
      if (onShow) scheduleOnRN(onShow);
    }
  });
  return { p, y, onLayout: (e: LayoutChangeEvent) => top.set(e.nativeEvent.layout.y + offset) };
}

/** Curva ease-out cúbica sobre una ventana [a, b] del progreso p. */
export function ease(p: number, a: number, b: number) {
  "worklet";
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return 1 - Math.pow(1 - t, 3);
}

export function Reveal({ children, from = "up", delay = 0, style, sfx }:
  { children: React.ReactNode; from?: "up" | "left" | "scale"; delay?: number; style?: object; sfx?: Sfx }) {
  const { y, vh, offset } = useContext(ScrollCtx);
  const reduced = useReducedMotion();
  const top = useSharedValue(1e6), p = useSharedValue(0);
  useAnimatedReaction(() => y.get() + vh * 0.92 > top.get(), (v, prev) => {
    if (v && !prev) {
      p.set(withDelay(delay * 1000, withTiming(1, { duration: 650, easing: EASE_OUT_WT })));
      if (sfx) scheduleOnRN(playSfx, sfx, 0.32);
    }
  });
  const st = useAnimatedStyle(() => {
    const k = 1 - p.get();
    return { opacity: p.get(), transform: reduced ? [] : from === "up" ? [{ translateY: k * 28 }, { scale: 0.97 + 0.03 * p.get() }]
      : from === "left" ? [{ translateX: -k * 36 }] : [{ scale: 0.9 + 0.1 * p.get() }] };
  });
  return <Animated.View onLayout={(e) => top.set(e.nativeEvent.layout.y + offset)} style={[style, st]}>{children}</Animated.View>;
}
