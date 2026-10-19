// Stockage en mémoire à la place du module natif : les stores Zustand persistés s'y lisent et s'y
// écrivent comme sur l'appareil, ce qui permet de tester aussi la réhydratation.
jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mocks fournis par les bibliothèques : sans eux, le layout racine (SafeAreaProvider,
// GestureHandlerRootView) ne rend rien hors appareil.
jest.mock(
	"react-native-safe-area-context",
	() => require("react-native-safe-area-context/jest/mock").default,
);
require("react-native-gesture-handler/jestSetup");

// Polices des icônes considérées comme chargées : depuis le SDK 58, expo-font cherche le fichier
// dans le registre d'assets de Metro, absent sous Jest.
jest.mock("expo-font", () => ({
	...jest.requireActual("expo-font"),
	isLoaded: jest.fn(() => true),
	loadAsync: jest.fn(() => Promise.resolve()),
}));

// Les vibrations n'ont pas d'équivalent en test : promesses résolues, enums conservés.
jest.mock("expo-haptics", () => ({
	impactAsync: jest.fn(() => Promise.resolve()),
	selectionAsync: jest.fn(() => Promise.resolve()),
	notificationAsync: jest.fn(() => Promise.resolve()),
	ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
	NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));
