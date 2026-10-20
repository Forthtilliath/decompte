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

// Graphiques SVG remplacés par une vue vide : leur rendu n'est pas ce qu'on teste, et leurs
// animations différées s'exécuteraient après la fin des tests.
jest.mock("react-native-gifted-charts", () => {
	const { createElement } = require("react");
	const { View } = require("react-native");
	return { PieChart: () => createElement(View, { testID: "PieChart" }) };
});

// Les vibrations n'ont pas d'équivalent en test : promesses résolues, enums conservés.
jest.mock("expo-haptics", () => ({
	impactAsync: jest.fn(() => Promise.resolve()),
	selectionAsync: jest.fn(() => Promise.resolve()),
	notificationAsync: jest.fn(() => Promise.resolve()),
	ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
	NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

// Pas d'écran à garder allumé sous Jest.
jest.mock("expo-keep-awake", () => ({ useKeepAwake: jest.fn() }));

// Ni appareil photo ni système de fichiers sous Jest : le choix d'une photo est annulé par défaut
// (un test qui en veut une la fournit avec `mockResolvedValueOnce`), la miniature enregistrée prend
// le nom de la photo d'origine, et les suppressions ne font qu'être comptées.
jest.mock("expo-image-picker", () => ({
	requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
	launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: null })),
	launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: null })),
}));
jest.mock("@forthtilliath/react-native-kit/utils/files/imageThumbnail", () => ({
	saveImageThumbnail: jest.fn((uri: string) =>
		Promise.resolve(`file:///documents/avatars/${uri.slice(uri.lastIndexOf("/") + 1)}`),
	),
}));
jest.mock("@forthtilliath/react-native-kit/utils/files/appFiles", () => ({
	getAppDirectory: jest.fn(() => ({ list: () => [] })),
	deleteFileQuietly: jest.fn(),
	pruneAppDirectory: jest.fn(() => 0),
}));
