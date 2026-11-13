// Entrada SOLO para la vista previa web (sin enrutador): navega por estado y funciona desde cualquier enlace.
import { registerRootComponent } from "expo";
import { useCallback, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { HomeScreen } from "../src/HomeScreen";
import { NavCtx, Screen } from "../src/nav";
import Confirmacion from "../src/screens/Confirmacion";
import Admin from "../src/screens/Admin";
import Entrar from "../src/screens/Entrar";
import Estilistas from "../src/screens/Estilistas";
import Horario from "../src/screens/Horario";
import Pago from "../src/screens/Pago";
import Registro from "../src/screens/Registro";
import Servicios from "../src/screens/Servicios";
import { StoreProvider } from "../src/store";
import { C } from "../src/theme";
import { WelcomeScreen } from "../src/WelcomeScreen";

type S = Screen | "bienvenida";
function Preview() {
  const [stack, setStack] = useState<S[]>(["bienvenida"]);
  const go = useCallback((s: Screen) => setStack((st) => (s === "inicio" ? ["inicio"] : [...st, s])), []);
  const back = useCallback(() => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)), []);
  const nav = useMemo(() => ({ go, back }), [go, back]);
  const cur = stack[stack.length - 1];
  const View = { bienvenida: () => <WelcomeScreen onNavigate={() => go("inicio")} />, inicio: HomeScreen, registro: Registro, servicios: Servicios, estilistas: Estilistas, horario: Horario, pago: Pago, confirmacion: Confirmacion, admin: Admin, entrar: Entrar }[cur];
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
        <StoreProvider><NavCtx.Provider value={nav}><View key={stack.length + cur} /></NavCtx.Provider></StoreProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
registerRootComponent(Preview);
