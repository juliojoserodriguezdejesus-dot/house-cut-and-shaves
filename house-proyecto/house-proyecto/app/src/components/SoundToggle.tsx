import React, { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { isMuted, setMuted } from "../sfx";
import { C } from "../theme";

export function SoundToggle({ top }: { top: number }) {
  const [m, setM] = useState(isMuted());
  return (
    <Pressable onPress={() => { setMuted(!m); setM(!m); }} hitSlop={10} accessibilityRole="button"
      accessibilityLabel={m ? "Activar sonido" : "Silenciar"} style={[st.btn, { top }]}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 9v6h4l5 4V5L8 9H4z" />
        {m ? <Path d="M17 9l5 6M22 9l-5 6" /> : <><Path d="M16.5 8.5a5 5 0 010 7" /><Path d="M19 6a8.5 8.5 0 010 12" /></>}
      </Svg>
    </Pressable>
  );
}
const st = StyleSheet.create({ btn: { position: "absolute", right: 12, zIndex: 20, width: 44, height: 44, alignItems: "center", justifyContent: "center",
  borderRadius: 22, backgroundColor: "rgba(10,13,15,0.45)" } });
