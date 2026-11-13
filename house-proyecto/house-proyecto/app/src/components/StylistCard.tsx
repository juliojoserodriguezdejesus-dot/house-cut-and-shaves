import React, { useCallback, useState } from "react";
import { Image, ImageSourcePropType, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { later } from "../sfx";
import { C, F } from "../theme";
import { EmblemStatic } from "./Emblem";
import { GoldFrame } from "./GoldFrame";
import { ease, useReveal } from "./Reveal";

const DUR = 2400;

/** Tarjeta por capas: el fondo verde se queda quieto y, al bajar, llegan el logo, el cargo, el nombre y la persona. */
export function StylistCard({ name, cut, side, width, role = "ESTILISTA", onPress }:
  { name: string; cut: ImageSourcePropType; side: 1 | -1; width: number; role?: string; onPress?: () => void }) {
  const H = width * (746 / 610);
  const onShow = useCallback(() => { later(0, "whoosh", 0.8); later(560, "snip", 0.5); later(1380, "ting", 0.7); later(1820, "thud", 0.8); }, []);
  const { p, onLayout } = useReveal(DUR, onShow);
  const [down, setDown] = useState(false);

  const card = useAnimatedStyle(() => { const e = ease(p.get(), 0, 0.28);
    return { opacity: Math.min(1, e * 2), transform: [{ translateX: side * (1 - e) * 110 }, { rotate: `${side * (1 - e) * 6}deg` }, { scale: 0.93 + 0.07 * e }] }; });
  const logo = useAnimatedStyle(() => { const e = ease(p.get(), 0.2, 0.44); return { opacity: e, transform: [{ translateY: -(1 - e) * 46 }, { scale: 0.75 + 0.25 * e }] }; });
  const roleS = useAnimatedStyle(() => { const e = ease(p.get(), 0.3, 0.52); return { opacity: e, transform: [{ translateX: -(1 - e) * 60 }] }; });
  const nm = useAnimatedStyle(() => { const e = ease(p.get(), 0.4, 0.64); return { opacity: e, transform: [{ translateX: (1 - e) * 70 }, { scale: 1.14 - 0.14 * e }] }; });
  const person = useAnimatedStyle(() => { const e = ease(p.get(), 0.5, 0.9);
    return { opacity: Math.min(1, e * 1.8), transform: [{ translateY: (1 - e) * H * 0.2 }, { scale: 1.07 - 0.07 * e }] }; });

  const body = (
    <Animated.View onLayout={onLayout} style={[{ width, height: H }, card]} accessible accessibilityLabel={`${role.toLowerCase()} ${name}`}>
      <Animated.View style={{ flex: 1, transform: [{ scale: down ? 0.97 : 1 }], transitionProperty: "transform", transitionDuration: "120ms" }}>
        <Animated.View style={[StyleSheet.absoluteFill, st.clip]}>
          <Image source={require("../../assets/images/bg_green.jpg")} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Animated.View style={[st.logo, { top: H * 0.035, width }, logo]}><EmblemStatic size={width * 0.22} /></Animated.View>
          <Animated.Text allowFontScaling={false} style={[st.txt, { top: H * 0.205, fontSize: width * 0.036, letterSpacing: width * 0.03 }, roleS]}>{role}</Animated.Text>
          <Animated.Text allowFontScaling={false} style={[st.txt, { top: H * 0.225, fontSize: width * 0.235, lineHeight: width * 0.28 }, nm]}>{name}</Animated.Text>
          <Animated.Image source={cut} style={[StyleSheet.absoluteFill, { width, height: H }, person]} resizeMode="cover" />
        </Animated.View>
        <GoldFrame p={p} width={width} height={H} />
      </Animated.View>
    </Animated.View>
  );
  return onPress ? (
    <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }} onPressIn={() => setDown(true)} onPressOut={() => setDown(false)} accessibilityRole="button">{body}</Pressable>
  ) : body;
}
const st = StyleSheet.create({
  clip: { borderRadius: 5, overflow: "hidden", backgroundColor: C.disc },
  logo: { position: "absolute", left: 0, alignItems: "center" },
  txt: { position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: F.display, color: C.gold },
});
