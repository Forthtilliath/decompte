/** @type {import('jest').Config} */
module.exports = {
	preset: "jest-expo",
	setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
	// Les tests vivent à côté du code (`lib/scoring.test.ts`), jamais dans `app/` : Expo Router
	// prendrait chaque fichier de ce dossier pour une route.
	testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/", "/.expo/"],
	collectCoverageFrom: [
		"{app,components,hooks,lib,stores,types,constants}/**/*.{ts,tsx}",
		"plugins/**/*.js",
		"!**/*.test.{ts,tsx}",
	],
	coverageReporters: ["text-summary", "lcov"],
};
