import React from "react";
import Animated from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { EASE_IN_OUT } from "../anim";
import { C } from "../theme";

/** Destello de cuatro puntas: nace tras el "ting" y vuelve a centellear cada ciertos segundos. */
export function Sparkle({ left, top, size, delay, period = 4.5 }:
  { left: number; top: number; size: number; delay: number; period?: number }) {
  return (
    <Animated.View pointerEvents="none" style={{
      position: "absolute", left: left - size / 2, top: top - size / 2, width: size, height: size,
      animationName: {
        from: { opacity: 0, transform: [{ scale: 0.2 }, { rotate: "0deg" }] },
        "12%": { opacity: 1, transform: [{ scale: 1 }, { rotate: "45deg" }] },
        "30%": { opacity: 0, transform: [{ scale: 0.2 }, { rotate: "90deg" }] },
        to: { opacity: 0, transform: [{ scale: 0.2 }, { rotate: "90deg" }] },
      },
      animationDuration: `${period}s`, animationDelay: `${delay}s`,
      animationIterationCount: "infinite", animationTimingFunction: EASE_IN_OUT, animationFillMode: "both",
    }}>
      <Svg width={size} height={size} viewBox="0 0 20 20">
        <Path d="M10 0 C10.8 6 14 9.2 20 10 C14 10.8 10.8 14 10 20 C9.2 14 6 10.8 0 10 C6 9.2 9.2 6 10 0Z" fill={C.goldLight} />
      </Svg>
    </Animated.View>
  );
}
