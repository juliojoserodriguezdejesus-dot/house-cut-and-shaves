import React from "react";
import { StyleSheet } from "react-native";
import Animated, { SharedValue, useAnimatedProps, useAnimatedStyle } from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";
import { C } from "../theme";
import { ease } from "./Reveal";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const DIAMOND = "M0 -4.5 L4.5 0 L0 4.5 L-4.5 0 Z";

/** Marco elegante: doble línea que se dibuja con el progreso `p` + rombos en esquinas y centros. */
export function GoldFrame({ p, width, height, start = 0.55 }: { p: SharedValue<number>; width: number; height: number; start?: number }) {
  const po = 2 * (width + height), pi = 2 * (width - 20 + height - 20);
  const o = useAnimatedStyle(() => ({ opacity: ease(p.get(), start + 0.05, start + 0.25) }));
  const outer = useAnimatedProps(() => ({ strokeDashoffset: po * (1 - ease(p.get(), start, 1)) }));
  const inner = useAnimatedProps(() => ({ strokeDashoffset: pi * (1 - ease(p.get(), start + 0.07, 1)) }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, o]}>
      <Svg width={width} height={height}>
        <AnimatedRect x={0.7} y={0.7} width={width - 1.4} height={height - 1.4} rx={4} fill="none" stroke={C.gold} strokeWidth={1.4} strokeDasharray={po} animatedProps={outer} />
        <AnimatedRect x={10} y={10} width={width - 20} height={height - 20} rx={2} fill="none" stroke={C.gold} strokeOpacity={0.55} strokeWidth={0.8} strokeDasharray={pi} animatedProps={inner} />
        {[[10, 10], [width - 10, 10], [10, height - 10], [width - 10, height - 10], [width / 2, 10], [width / 2, height - 10]].map(([x, y], i) => (
          <Path key={i} d={DIAMOND} transform={`translate(${x} ${y})`} fill={C.gold} />
        ))}
      </Svg>
    </Animated.View>
  );
}
