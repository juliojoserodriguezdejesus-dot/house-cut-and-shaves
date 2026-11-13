import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, KeyboardTypeOptions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Line, Path, Circle } from "react-native-svg";
import { C, F } from "../theme";

const ERR = "#E58B7B";
type Props = { label: string; value: string; onChangeText: (t: string) => void; error?: string | null; secure?: boolean; keyboardType?: KeyboardTypeOptions;
  prefix?: string; maxLength?: number; shake?: number; autoCapitalize?: "none" | "words"; onBlur?: () => void; autoComplete?: any };

/** Campo con etiqueta flotante, subrayado dorado que se dibuja, error que entra deslizando y "ojito" para contraseñas. */
export function Field({ label, value, onChangeText, error, secure, keyboardType, prefix, maxLength, shake = 0, autoCapitalize = "none", onBlur, autoComplete }: Props) {
  const [focus, setFocus] = useState(false), [show, setShow] = useState(false);
  const lifted = focus || value.length > 0 || !!prefix;
  const sx = useSharedValue(0);
  useEffect(() => { if (shake) sx.set(withSequence(withTiming(-9, { duration: 55 }), withRepeat(withTiming(9, { duration: 90 }), 4, true), withTiming(0, { duration: 55 }))); }, [shake, sx]);
  const sh = useAnimatedStyle(() => ({ transform: [{ translateX: sx.get() }] }));
  const line = error ? ERR : C.gold;
  return (
    <Animated.View style={[{ marginBottom: 6 }, sh]}>
      <View style={st.box}>
        <Animated.Text pointerEvents="none" style={[st.label, { color: error ? ERR : focus ? C.gold : "rgba(243,230,204,0.6)" },
          { transform: [{ translateY: lifted ? -14 : 0 }, { scale: lifted ? 0.78 : 1 }, { translateX: lifted ? -14 : 0 }], transitionProperty: ["transform", "color"], transitionDuration: 180 }]}>{label}</Animated.Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {prefix ? <Text style={st.prefix}>{prefix}</Text> : null}
          <TextInput value={value} onChangeText={onChangeText} onFocus={() => setFocus(true)} onBlur={() => { setFocus(false); onBlur?.(); }} style={st.input}
            secureTextEntry={secure && !show} keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoCorrect={false} maxLength={maxLength} autoComplete={autoComplete}
            selectionColor={C.gold} placeholderTextColor="rgba(243,230,204,0.3)" accessibilityLabel={label} />
          {secure ? (
            <Pressable onPress={() => setShow((s) => !s)} hitSlop={10} accessibilityRole="button" accessibilityLabel={show ? "Ocultar contraseña" : "Mostrar contraseña"} style={st.eye}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 12 12z" /><Circle cx={12} cy={12} r={3} />
              </Svg>
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: show ? 0 : 1, transitionProperty: "opacity", transitionDuration: 160 }]}>
                <Svg width={24} height={24} viewBox="0 0 24 24"><Line x1={4} y1={20} x2={20} y2={4} stroke={C.gold} strokeWidth={2} strokeLinecap="round" /></Svg>
              </Animated.View>
            </Pressable>
          ) : null}
        </View>
        <View style={{ height: 1.5, backgroundColor: "rgba(235,172,86,0.25)" }}>
          <View style={{ height: 1.5, backgroundColor: line, transform: [{ scaleX: focus || error ? 1 : 0 }], transformOrigin: "left", transitionProperty: "transform", transitionDuration: 260 } as any} />
        </View>
      </View>
      <Animated.Text style={[st.err, { opacity: error ? 1 : 0, transform: [{ translateY: error ? 0 : -5 }], transitionProperty: ["opacity", "transform"], transitionDuration: 200 }]}>{error ?? " "}</Animated.Text>
    </Animated.View>
  );
}
const st = StyleSheet.create({
  box: { paddingTop: 20 },
  label: { position: "absolute", left: 0, top: 30, fontFamily: F.ui, fontSize: 16 },
  input: { flex: 1, fontFamily: F.ui, fontSize: 17, color: C.cream, paddingVertical: 10, paddingRight: 8 },
  prefix: { fontFamily: F.uiBold, fontSize: 17, color: C.gold, marginRight: 8 },
  eye: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  err: { fontFamily: F.ui, fontSize: 12.5, color: ERR, marginTop: 4, minHeight: 18 },
});
