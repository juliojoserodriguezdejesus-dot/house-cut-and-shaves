import { useRouter } from "expo-router";
import { WelcomeScreen } from "../src/WelcomeScreen";

export default function Index() {
  const router = useRouter();
  return <WelcomeScreen onNavigate={() => router.replace("/inicio")} />;
}
