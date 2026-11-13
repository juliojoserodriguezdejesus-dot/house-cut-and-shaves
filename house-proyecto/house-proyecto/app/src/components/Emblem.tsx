import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedProps, useSharedValue, withDelay, withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Path, Polygon, Rect, Text as SvgText } from "react-native-svg";
import { EASE_IN_OUT_WT, EASE_OUT, enter } from "../anim";
import { C, F } from "../theme";
import { T } from "../timeline";

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const VB = "0 0 200 180";
const OUTER = "100,38 162,100 100,162 38,100";
const INNER = "100,45 155,100 100,155 45,100";
const OUTER_LEN = 4 * Math.hypot(62, 62);
const INNER_LEN = 4 * Math.hypot(55, 55);

function Layer({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={VB}>{children}</Svg>
    </Animated.View>
  );
}

function Razor({ x, y, rot, id }: { x: number; y: number; rot: number; id: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot})`}>
      <Rect x={0} y={-3.2} width={21} height={6.4} rx={3} fill={C.goldDeep} />
      <Path d="M21 -2.6 L60 -2.6 Q67 -2.6 67 1.2 L67 1.8 L21 2.6 Z" fill={C.gold} />
      <Path d="M24 -1.2 L60 -1.2" stroke={C.goldLight} strokeWidth={0.7} strokeLinecap="round" />
      <Circle cx={21} cy={0} r={3.3} fill={C.gold} stroke={C.disc} strokeWidth={1} />
    </G>
  );
}

export function Emblem({ reduced }: { reduced: boolean }) {
  const draw = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) draw.set(withDelay(T.diamond * 1000, withTiming(1, { duration: 900, easing: EASE_IN_OUT_WT })));
  }, [reduced, draw]);

  const outerProps = useAnimatedProps(() => ({ strokeDashoffset: OUTER_LEN * (1 - draw.get()) }));
  const innerProps = useAnimatedProps(() => ({ strokeDashoffset: INNER_LEN * (1 - draw.get()) }));

  const fly = (side: 1 | -1, delay: number) =>
    ({
      animationName: reduced
        ? { from: { opacity: 0 }, to: { opacity: 1 } }
        : {
            from: { opacity: 0, transform: [{ translateX: 90 * side }, { translateY: -50 }, { rotate: `${35 * side}deg` }] },
            "65%": { opacity: 1, transform: [{ translateX: -5 * side }, { translateY: 3 }, { rotate: `${-4 * side}deg` }] },
            to: { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: "0deg" }] },
          },
      animationDuration: "0.55s",
      animationDelay: `${delay}s`,
      animationTimingFunction: EASE_OUT,
      animationFillMode: "both",
    }) as const;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Layer>
        <AnimatedPolygon points={OUTER} fill="none" stroke={C.gold} strokeWidth={1.6} strokeLinejoin="miter"
          strokeDasharray={OUTER_LEN} animatedProps={outerProps} />
        <AnimatedPolygon points={INNER} fill="none" stroke={C.gold} strokeWidth={0.8} strokeOpacity={0.9}
          strokeDasharray={INNER_LEN} animatedProps={innerProps} />
      </Layer>

      <Layer style={fly(1, T.razorL)}><Razor x={97} y={44} rot={215} id="l" /></Layer>
      <Layer style={fly(-1, T.razorR)}><Razor x={103} y={44} rot={-35} id="r" /></Layer>

      <Layer style={enter(reduced, T.glyph, { y: 0, scale: 0.85, dur: 0.5 })}>
        <Rect x={78} y={80} width={15} height={2.2} fill={C.gold} />
        <Rect x={107} y={80} width={15} height={2.2} fill={C.gold} />
        <Rect x={78} y={118} width={15} height={2.2} fill={C.gold} />
        <Rect x={107} y={118} width={15} height={2.2} fill={C.gold} />
        <Rect x={82} y={80} width={7} height={40} fill={C.gold} />
        <Rect x={111} y={80} width={7} height={40} fill={C.gold} />
        <Rect x={89} y={99} width={22} height={2.2} fill={C.gold} />
        <SvgText x={100} y={96.5} fontSize={11} fontFamily={F.display} fill={C.gold} textAnchor="middle">C</SvgText>
        <SvgText x={100} y={115} fontSize={11} fontFamily={F.display} fill={C.gold} textAnchor="middle">S</SvgText>
        <SvgText x={63} y={103.5} fontSize={9.5} fontFamily={F.display} fill={C.gold} textAnchor="middle">20</SvgText>
        <SvgText x={137} y={103.5} fontSize={9.5} fontFamily={F.display} fill={C.gold} textAnchor="middle">20</SvgText>
      </Layer>

      <Layer style={enter(reduced, T.glyph + 0.25, { y: -6, scale: 0.9, dur: 0.5 })}>
        <Path d="M100 167 C93 167 91 174 97 174.5 C99.5 174.7 100 172.5 100 171.5 C100 172.5 100.5 174.7 103 174.5 C109 174 107 167 100 167 Z"
          fill="none" stroke={C.gold} strokeWidth={1} />
        <Circle cx={100} cy={170.4} r={1.1} fill={C.gold} />
      </Layer>
    </View>
  );
}

/** Logo completo y estático (para usarlo como capa dentro de otras animaciones). */
export function EmblemStatic({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.9} viewBox={VB}>
      <Polygon points={OUTER} fill="none" stroke={C.gold} strokeWidth={1.6} />
      <Polygon points={INNER} fill="none" stroke={C.gold} strokeWidth={0.8} strokeOpacity={0.9} />
      <Razor x={97} y={44} rot={215} id="l" /><Razor x={103} y={44} rot={-35} id="r" />
      {[[78, 80], [107, 80], [78, 118], [107, 118]].map(([x, y], i) => <Rect key={i} x={x} y={y} width={15} height={2.2} fill={C.gold} />)}
      <Rect x={82} y={80} width={7} height={40} fill={C.gold} /><Rect x={111} y={80} width={7} height={40} fill={C.gold} />
      <Rect x={89} y={99} width={22} height={2.2} fill={C.gold} />
      <SvgText x={100} y={96.5} fontSize={11} fontFamily={F.display} fill={C.gold} textAnchor="middle">C</SvgText>
      <SvgText x={100} y={115} fontSize={11} fontFamily={F.display} fill={C.gold} textAnchor="middle">S</SvgText>
      <SvgText x={63} y={103.5} fontSize={9.5} fontFamily={F.display} fill={C.gold} textAnchor="middle">20</SvgText>
      <SvgText x={137} y={103.5} fontSize={9.5} fontFamily={F.display} fill={C.gold} textAnchor="middle">20</SvgText>
      <Path d="M100 167 C93 167 91 174 97 174.5 C99.5 174.7 100 172.5 100 171.5 C100 172.5 100.5 174.7 103 174.5 C109 174 107 167 100 167 Z" fill="none" stroke={C.gold} strokeWidth={1} />
    </Svg>
  );
}
