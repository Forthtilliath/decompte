import type { ReleaseHistoryEntry } from "@forthtilliath/expo-release-updates/githubReleases";
import { useCallback, useRef, useState } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { fetchSortedReleaseHistory } from "@/lib/appUpdate";

const PAGE_SIZE = 5;
/** Distance au bas de l'écran (px) à partir de laquelle la tranche suivante s'affiche. */
const LOAD_MORE_THRESHOLD = 200;

/**
 * Historique des versions affiché par tranches de 5, la suivante arrivant quand on atteint le bas
 * du ScrollView. L'écran du kit affiche ce que renvoie `fetchHistory` et le rappelle dès que la
 * fonction change : GitHub n'est interrogé qu'une fois, chaque tranche re-découpe la même liste.
 */
export function usePagedReleaseHistory() {
	const [history] = useState(fetchSortedReleaseHistory);
	const [limit, setLimit] = useState(PAGE_SIZE);
	// Versions affichées et disponibles : tant que la tranche demandée n'est pas servie, le
	// défilement n'en réclame pas une autre.
	const [shown, setShown] = useState({ count: 0, total: 0 });
	const viewport = useRef({ height: 0, offset: 0, content: 0 });

	const fetchHistory = useCallback(async (): Promise<ReleaseHistoryEntry[]> => {
		const releases = await history;
		const page = releases.slice(0, limit);
		setShown({ count: page.length, total: releases.length });
		return page;
	}, [history, limit]);

	const loadMoreIfNearBottom = useCallback(() => {
		const { height, offset, content } = viewport.current;
		const nearBottom = height > 0 && height + offset >= content - LOAD_MORE_THRESHOLD;
		if (nearBottom && shown.count === limit && limit < shown.total) setLimit(limit + PAGE_SIZE);
	}, [limit, shown]);

	const onScroll = useCallback(
		({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
			viewport.current = {
				height: nativeEvent.layoutMeasurement.height,
				offset: nativeEvent.contentOffset.y,
				content: nativeEvent.contentSize.height,
			};
			loadMoreIfNearBottom();
		},
		[loadMoreIfNearBottom],
	);

	const onLayout = useCallback(
		({ nativeEvent }: LayoutChangeEvent) => {
			viewport.current.height = nativeEvent.layout.height;
			loadMoreIfNearBottom();
		},
		[loadMoreIfNearBottom],
	);

	// Contenu qui grandit (tranche ajoutée) ou trop court pour défiler : on revérifie sans attendre
	// un nouveau geste.
	const onContentSizeChange = useCallback(
		(_width: number, height: number) => {
			viewport.current.content = height;
			loadMoreIfNearBottom();
		},
		[loadMoreIfNearBottom],
	);

	return {
		fetchHistory,
		scrollProps: { onScroll, onLayout, onContentSizeChange, scrollEventThrottle: 100 },
	};
}
