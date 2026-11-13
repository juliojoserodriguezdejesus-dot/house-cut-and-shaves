import { createContext, useContext } from "react";
export type Screen = "inicio" | "registro" | "servicios" | "estilistas" | "horario" | "pago" | "confirmacion" | "admin" | "entrar";
export const NavCtx = createContext<{ go: (s: Screen) => void; back: () => void }>(null as never);
export const useNav = () => useContext(NavCtx);
