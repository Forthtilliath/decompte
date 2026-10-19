/** @type {import('jest').Config} */
module.exports = {
	preset: "jest-expo",
	setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
	// Les tests vivent à côté du code (`lib/scoring.test.ts`), jamais dans `app/` : Expo Router
	// prendrait chaque fichier de ce dossier pour une route.
	// `.claude/` contient des worktrees git : leurs tests ne concernent pas cette copie.
	testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/", "/.expo/", "/.claude/"],
	// Liste de jest-expo + les paquets @forthtilliath et nanoid, publiés en ESM : Babel doit les
	// transformer.
	transformIgnorePatterns: [
		"/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|@forthtilliath|nanoid))",
		"/node_modules/react-native-reanimated/plugin/",
	],
	collectCoverageFrom: [
		"{app,components,hooks,lib,stores,types,constants}/**/*.{ts,tsx}",
		"plugins/**/*.js",
		"!**/*.test.{ts,tsx}",
	],
	coverageReporters: ["text-summary", "lcov"],
};
