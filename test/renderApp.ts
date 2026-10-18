import { renderRouter } from "expo-router/testing-library";

/**
 * Rend l'app entière (vrais écrans de `app/`, vraie navigation Expo Router) à partir d'une URL.
 * `renderRouter` active les faux minuteurs : il faut les avancer pour que le premier rendu
 * asynchrone de Testing Library v14 se termine.
 */
export async function renderApp(initialUrl: string) {
	const app = renderRouter("./app", { initialUrl });
	await jest.advanceTimersByTimeAsync(100);
	await app;
	// `app` est la promesse du rendu, enrichie par expo-router : la renvoyer telle quelle depuis une
	// fonction async la déballerait et perdrait ces méthodes.
	return {
		getPathname: () => app.getPathname(),
		getSearchParams: () => app.getSearchParams(),
	};
}
