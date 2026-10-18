/** @type {import('jest').Config} */
module.exports = {
	preset: "jest-expo",
	setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
	// Les tests vivent à côté du code (`lib/scoring.test.ts`), jamais dans `app/` : Expo Router
	// prendrait chaque fichier de ce dossier pour une route.
	testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/", "/.expo/"],
	// Liste de jest-expo + les paquets @forthtilliath, publiés en ESM : Babel doit les transformer.
	transformIgnorePatterns: [
		"/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|@forthtilliath))",
		"/node_modules/react-native-reanimated/plugin/",
	],
	collectCoverageFrom: [
		"{app,components,hooks,lib,stores,types,constants}/**/*.{ts,tsx}",
		"plugins/**/*.js",
		"!**/*.test.{ts,tsx}",
	],
	coverageReporters: ["text-summary", "lcov"],
};
