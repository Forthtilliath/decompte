import type { ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";

type Props = {
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	style?: StyleProp<ViewStyle>;
	children: ReactNode;
};

/** Vue qui réagit à un balayage horizontal (voir useHorizontalSwipe). */
export function SwipeView({ onSwipeLeft, onSwipeRight, style, children }: Props) {
	const handlers = useHorizontalSwipe({ onSwipeLeft, onSwipeRight });
	return (
		<View style={style} {...handlers}>
			{children}
		</View>
	);
}
