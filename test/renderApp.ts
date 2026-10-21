import { createRenderApp } from "@forthtilliath/expo-test-kit/router/createRenderApp";
import { router } from "expo-router";
import { act, renderRouter } from "expo-router/testing-library";

/**
 * Rend l'app entière (vrais écrans de `app/`, vraie navigation Expo Router) à partir d'une URL.
 * `renderRouter` active les faux minuteurs : `createRenderApp` les avance pour que le premier
 * rendu asynchrone de Testing Library v14 se termine, et `navigate` attend le rendu.
 */
export const renderApp = createRenderApp({
	renderRouter,
	act,
	navigate: (path) => {
		router.navigate(path);
	},
	advanceTimersByTimeAsync: (ms) => jest.advanceTimersByTimeAsync(ms),
});
