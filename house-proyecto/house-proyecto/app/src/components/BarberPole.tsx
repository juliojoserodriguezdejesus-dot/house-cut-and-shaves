import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useReducedMotion } from "react-native-reanimated";
import Svg, { Polygon } from "react-native-svg";

const P = 90; // período del patrón (3 franjas)
const COL = ["#B0342E", "#F1E8D6", "#27457F"];

/** Poste de barbero: franjas rojo/crema/azul que suben sin parar dentro de una cápsula con brillo de vidrio. */
export function BarberPole({ width = 22, style }: { width?: number; style?: object }) {
  const reduced = useReducedMotion();
  const bands = Array.from({ length: 48 }, (_, k) => k);
  return (
    <View style={[{ width, borderRadius: width / 2, overflow: "hidden", borderWidth: 1.4, borderColor: "rgba(235,172,86,0.7)", backgroundColor: "#111" }, style]}>
      <Animated.View style={[{ position: "absolute", left: 0, top: -P, height: 1600 }, reduced ? undefined : {
        animationName: { from: { transform: [{ translateY: 0 }] }, to: { transform: [{ translateY: P }] } },
        animationDuration: "2.4s", animationIterationCount: "infinite", animationTimingFunction: "linear" }]}>
        <Svg width={width} height={1600}>
          {bands.map((k) => { const y = k * (P / 3), h = P / 3 + 1;
            return <Polygon key={k} fill={COL[k % 3]} points={`0,${y} ${width},${y - width * 0.8} ${width},${y - width * 0.8 + h} 0,${y + h}`} />; })}
        </Svg>
      </Animated.View>
      <LinearGradient colors={["rgba(0,0,0,0.45)", "rgba(255,255,255,0.35)", "rgba(0,0,0,0)", "rgba(0,0,0,0.5)"]} locations={[0, 0.25, 0.55, 1]}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }} />
    </View>
  );
}
