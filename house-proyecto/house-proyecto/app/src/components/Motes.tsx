import React, { useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated from "react-native-reanimated";
import { C } from "../theme";

/** Polvillo dorado que sube despacio por la pantalla (ambiente, solo transform/opacity). */
export function Motes({ count = 16, startAt = 0.5 }: { count?: number; startAt?: number }) {
  const { width, height } = useWindowDimensions();
  const motes = useMemo(() => Array.from({ length: count }, (_, i) => {
    const r = (n: number) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
    return { x: r(1) * width, y: height * (0.45 + r(2) * 0.5), s: 2 + r(3) * 2.6,
      dur: 7 + r(4) * 7, delay: startAt + r(5) * 6, drift: (r(6) - 0.5) * 50, rise: height * (0.25 + r(7) * 0.3) };
  }), [count, width, height, startAt]);

  return (
    <>
      {motes.map((m, i) => (
        <Animated.View key={i} pointerEvents="none" style={[styles.mote, {
          left: m.x, top: m.y, width: m.s, height: m.s, borderRadius: m.s,
          animationName: {
            from: { opacity: 0, transform: [{ translateY: 0 }, { translateX: 0 }] },
            "20%": { opacity: 0.85 },
            "75%": { opacity: 0.45 },
            to: { opacity: 0, transform: [{ translateY: -m.rise }, { translateX: m.drift }] },
          },
          animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s`,
          animationIterationCount: "infinite", animationTimingFunction: "linear", animationFillMode: "backwards",
        }]} />
      ))}
    </>
  );
}
const styles = StyleSheet.create({ mote: { position: "absolute", backgroundColor: C.goldLight } });
