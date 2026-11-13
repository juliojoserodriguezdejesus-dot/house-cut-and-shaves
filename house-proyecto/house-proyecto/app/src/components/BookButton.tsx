import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Line } from "react-native-svg";
import { EASE_IN_OUT, enter } from "../anim";
import { BRAND, C, F } from "../theme";
import { T } from "../timeline";

/** Una hoja de tijera: gira sobre el pivote y se cierra con un "snip" cada 2.6 s. */
function Blade({ dir, delay }: { dir: 1 | -1; delay: number }) {
  const a = 9 * dir;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
      animationName: {
        from: { transform: [{ rotate: "0deg" }] },
        "62%": { transform: [{ rotate: "0deg" }] },
        "72%": { transform: [{ rotate: `${a}deg` }] },
        "80%": { transform: [{ rotate: "0deg" }] },
        to: { transform: [{ rotate: "0deg" }] },
      },
      animationDuration: "2.6s", animationDelay: `${delay + 0.8}s`,
      animationIterationCount: "infinite", animationTimingFunction: EASE_IN_OUT,
    }]}>
      <Svg width={28} height={28} viewBox="0 0 28 28">
        {dir === 1
          ? <><Line x1={9} y1={19} x2={20} y2={3} stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" /><Circle cx={7.5} cy={22.5} r={3.4} stroke={C.ink} strokeWidth={1.8} fill="none" /></>
          : <><Line x1={19} y1={19} x2={8} y2={3} stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" /><Circle cx={20.5} cy={22.5} r={3.4} stroke={C.ink} strokeWidth={1.8} fill="none" /></>}
      </Svg>
    </Animated.View>
  );
}

export function BookButton({ onPress, reduced, width, delay = T.button, label = BRAND.cta }: { onPress: () => void; reduced: boolean; width: number; delay?: number; label?: string }) {
  const [pressed, setPressed] = useState(false);
  const h = 58;
  return (
    <Animated.View style={[{ width, height: h }, enter(reduced, delay, { y: 28, scale: 0.96, dur: 0.6 })]}>
      {!reduced && (
        <Animated.View pointerEvents="none" style={[styles.ring, {
          borderRadius: h / 2,
          animationName: { from: { opacity: 0.55, transform: [{ scale: 1 }] }, to: { opacity: 0, transform: [{ scaleX: 1.14 }, { scaleY: 1.5 }] } },
          animationDuration: "2.2s", animationDelay: `${delay + 0.6}s`,
          animationIterationCount: "infinite", animationTimingFunction: "ease-out", animationFillMode: "backwards",
        }]} />
      )}
      <Animated.View style={{ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }], transitionProperty: "transform", transitionDuration: "120ms" }}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
        onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
        hitSlop={8} pressRetentionOffset={24}
        style={[styles.btn, { borderRadius: h / 2 }]}>
        <LinearGradient colors={[C.goldLight, C.gold, C.goldDeep]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
        {!reduced && (
          <Animated.View pointerEvents="none" style={[styles.shine, {
            animationName: { from: { transform: [{ translateX: -120 }, { skewX: "-20deg" }] }, "35%": { transform: [{ translateX: width + 40 }, { skewX: "-20deg" }] }, to: { transform: [{ translateX: width + 40 }, { skewX: "-20deg" }] } },
            animationDuration: "4s", animationDelay: `${delay + 1.2}s`, animationIterationCount: "infinite", animationTimingFunction: EASE_IN_OUT,
          }]}>
            <LinearGradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        )}
        <View style={styles.row}>
          <View style={{ width: 28, height: 28 }}>{reduced ? null : <><Blade dir={1} delay={delay} /><Blade dir={-1} delay={delay} /></>}</View>
          <Text style={styles.label} allowFontScaling={false}>{label}</Text>
        </View>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: { ...StyleSheet.absoluteFill, borderWidth: 1.5, borderColor: C.gold },
  btn: { flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,236,200,0.5)" },
  shine: { position: "absolute", top: 0, bottom: 0, width: 70 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { fontFamily: F.uiBold, fontSize: 18, letterSpacing: 0.6, color: C.ink },
});
