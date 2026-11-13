import React from "react";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import layout from "../logoLayout.json";
import { enter } from "../anim";
import { Sparkle } from "./Sparkle";

type Box = { x: number; y: number; w: number; h: number };
const L = layout as { W: number; H: number; emblem: Box; letters: Box[]; tag: Box | null };
const IMG = {
  shadow: require("../../assets/logo/shadow.webp"), emblem: require("../../assets/logo/emblem.webp"), tag: require("../../assets/logo/tag.webp"),
  letters: [require("../../assets/logo/l0.webp"), require("../../assets/logo/l1.webp"), require("../../assets/logo/l2.webp"), require("../../assets/logo/l3.webp"), require("../../assets/logo/l4.webp")],
};
/** Alto del logo respecto a su ancho. */
export const LOGO_RATIO = L.H / L.W;

/** Logo dorado con relieve: llega por capas y una sombra que orbita simula la luz moviéndose sobre el metal. */
export function ReliefLogo({ width, reduced }: { width: number; reduced: boolean }) {
  const h = width * LOGO_RATIO;
  const at = (b: Box) => ({ position: "absolute" as const, left: b.x * width, top: b.y * h, width: b.w * width, height: b.h * h });
  const spark = [[0.434, 0.057, 14, 3.0, 4.6], [0.56, 0.057, 12, 3.3, 5.3], [0.496, 0.316, 12, 3.7, 4.1], [0.236, 0.217, 10, 3.5, 5.8], [0.76, 0.217, 10, 3.9, 5.0]];
  return (
    <Animated.View style={[{ width, height: h }, reduced ? undefined : { animationName: { from: { transform: [{ translateY: 0 }] }, to: { transform: [{ translateY: -6 }] } },
      animationDuration: "3.8s", animationDirection: "alternate", animationIterationCount: "infinite", animationTimingFunction: "ease-in-out", animationDelay: "2.6s" }]}>
      {/* Sombra: se desvanece y orbita despacio para dar sensación de relieve */}
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0, width, height: h }, enter(reduced, 1.7, { y: 0, scale: 1, dur: 0.9 })]}>
        <Animated.View style={[{ width, height: h }, reduced ? { transform: [{ translateX: 4 }, { translateY: 7 }] } : {
          animationName: { from: { transform: [{ translateX: 5 }, { translateY: 8 }] }, "33%": { transform: [{ translateX: -1 }, { translateY: 10 }] }, "66%": { transform: [{ translateX: -6 }, { translateY: 5 }] }, to: { transform: [{ translateX: 5 }, { translateY: 8 }] } },
          animationDuration: "8s", animationIterationCount: "infinite", animationTimingFunction: "ease-in-out", animationDelay: "2.2s" }]}>
          <Image source={IMG.shadow} style={{ width, height: h }} resizeMode="contain" />
        </Animated.View>
      </Animated.View>
      <Animated.Image source={IMG.emblem} resizeMode="contain" style={[at(L.emblem), reduced ? undefined : {
        animationName: { from: { opacity: 0, transform: [{ translateY: -60 }, { scale: 0.78 }] }, "60%": { opacity: 1, transform: [{ translateY: 7 }, { scale: 1.03 }] }, to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] } },
        animationDuration: "1s", animationDelay: "0.25s", animationTimingFunction: "ease-out", animationFillMode: "both" }]} />
      {L.letters.map((b, i) => <Animated.Image key={i} source={IMG.letters[i]} resizeMode="contain" style={[at(b), enter(reduced, 1.0 + i * 0.09, { y: 28, scale: 0.94, dur: 0.6 })]} />)}
      {L.tag && <Animated.Image source={IMG.tag} resizeMode="contain" style={[at(L.tag), enter(reduced, 1.75, { y: 8, dur: 0.6 })]} />}
      {!reduced && spark.map(([fx, fy, sz, d, p], i) => <Sparkle key={i} left={fx * width} top={fy * h} size={sz} delay={d} period={p} />)}
    </Animated.View>
  );
}
