import { Platform } from "react-native";

/** Pide permiso y devuelve el token de notificaciones de este celular (solo app instalada; en web devuelve null). */
export async function registerPush(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const N = require("expo-notifications"), Device = require("expo-device"), Constants = require("expo-constants").default;
    if (!Device.isDevice) return null;
    N.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
    if (Platform.OS === "android") await N.setNotificationChannelAsync("citas", { name: "Citas nuevas", importance: N.AndroidImportance.HIGH, vibrationPattern: [0, 250, 250, 250], lightColor: "#EBAC56" });
    let { status } = await N.getPermissionsAsync();
    if (status !== "granted") ({ status } = await N.requestPermissionsAsync());
    if (status !== "granted") return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    return (await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  } catch { return null; }
}
