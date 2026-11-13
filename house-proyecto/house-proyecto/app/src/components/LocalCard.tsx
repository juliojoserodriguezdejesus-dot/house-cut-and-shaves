import React, { useCallback } from "react";
import { Image, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useReducedMotion } from "react-native-reanimated";
import { later } from "../sfx";
import { C, F } from "../theme";
import { EmblemStatic } from "./Emblem";
import { GoldFrame } from "./GoldFrame";
import { ease, useReveal } from "./Reveal";

/** Foto del local con el mismo trato que las tarjetas del equipo: capas, marco dorado y movimiento lento. */
export function LocalCard({ width }: { width: number }) {
  const H = width * (655 / 610), reduced = useReducedMotion();
  const onShow = useCallback(() => { later(0, "whoosh", 0.6); later(900, "snip", 0.5); later(1500, "ting", 0.5); }, []);
  const { p, onLayout } = useReveal(2200, onShow);
  const card = useAnimatedStyle(() => { const e = ease(p.get(), 0, 0.3); return { opacity: Math.min(1, e * 2), transform: [{ translateY: (1 - e) * 40 }, { scale: 0.94 + 0.06 * e }] }; });
  const img = useAnimatedStyle(() => { const e = ease(p.get(), 0.05, 0.6); return { transform: [{ scale: 1.18 - 0.18 * e }] }; });
  const logo = useAnimatedStyle(() => { const e = ease(p.get(), 0.4, 0.6); return { opacity: e, transform: [{ translateY: -(1 - e) * 30 }] }; });
  const cap = useAnimatedStyle(() => { const e = ease(p.get(), 0.5, 0.75); return { opacity: e, transform: [{ translateX: -(1 - e) * 50 }] }; });
  return (
    <Animated.View onLayout={onLayout} style={[{ width, height: H }, card]} accessible accessibilityLabel="Fachada de House Cuts & Shaves">
      <View style={[StyleSheet.absoluteFill, { borderRadius: 5, overflow: "hidden", backgroundColor: C.disc }]}>
        <Animated.View style={[StyleSheet.absoluteFill, img]}>
          <Animated.View style={[StyleSheet.absoluteFill, reduced ? undefined : { animationName: { from: { transform: [{ scale: 1 }] }, to: { transform: [{ scale: 1.05 }] } },
            animationDuration: "9s", animationDirection: "alternate", animationIterationCount: "infinite", animationTimingFunction: "ease-in-out", animationDelay: "2.4s" }]}>
            <Image source={require("../../assets/images/fachada.jpg")} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </Animated.View>
        </Animated.View>
        <LinearGradient colors={["rgba(10,13,15,0.55)", "transparent", "rgba(10,13,15,0.9)"]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
        <Animated.View style={[{ position: "absolute", top: 22, left: 24 }, logo]}><EmblemStatic size={64} /></Animated.View>
        <Animated.Text allowFontScaling={false} style={[{ position: "absolute", left: 26, bottom: 30, fontFamily: F.displayItalic, fontSize: 24, color: C.cream }, cap]}>Instalaciones modernas</Animated.Text>
      </View>
      <GoldFrame p={p} width={width} height={H} start={0.6} />
    </Animated.View>
  );
}
