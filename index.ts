// Point d'entrée : l'app d'Expo Router, plus la tâche de fond du widget d'écran d'accueil, qu'Android
// lance aussi quand l'app est fermée (elle doit donc être enregistrée avant tout écran).
import "expo-router/entry";
import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "@/widget/widgetTaskHandler";

registerWidgetTaskHandler(widgetTaskHandler);
