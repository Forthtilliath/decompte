import { router } from "expo-router";
import { act, renderRouter } from "expo-router/testing-library";

/**
 * Rend l'app entière (vrais écrans de `app/`, vraie navigation Expo Router) à partir d'une URL.
 * `renderRouter` active les faux minuteurs : il faut les avancer pour que le premier rendu
 * asynchrone de Testing Library v14 se termine.
 */
export async function renderApp(initialUrl: string) {
	const rendering = renderRouter("./app", { initialUrl });
	await jest.advanceTimersByTimeAsync(100);
	const app = await rendering;
	return {
		getPathname: () => app.getPathname(),
		getSearchParams: () => app.getSearchParams(),
		/** `testRouter` d'expo-router vérifie le chemin juste après la navigation, sans attendre le rendu. */
		navigate: async (path: string) => {
			await act(async () => {
				router.navigate(path);
			});
		},
	};
}
