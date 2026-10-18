// Stockage en mémoire à la place du module natif : les stores Zustand persistés s'y lisent et s'y
// écrivent comme sur l'appareil, ce qui permet de tester aussi la réhydratation.
jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Les vibrations n'ont pas d'équivalent en test : promesses résolues, enums conservés.
jest.mock("expo-haptics", () => ({
	impactAsync: jest.fn(() => Promise.resolve()),
	selectionAsync: jest.fn(() => Promise.resolve()),
	notificationAsync: jest.fn(() => Promise.resolve()),
	ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
	NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));
