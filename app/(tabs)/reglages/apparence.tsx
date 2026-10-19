import { RadioGroup } from "@/components/ui/RadioGroup";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { type ThemeMode, useThemeStore } from "@/stores/themeStore";

export default function AppearanceSettingsScreen() {
	const mode = useThemeStore((s) => s.mode);
	const setMode = useThemeStore((s) => s.setMode);

	return (
		<ScreenContainer>
			<RadioGroup<ThemeMode>
				options={[
					{ value: "dark", label: "Sombre" },
					{ value: "light", label: "Clair" },
				]}
				value={mode}
				onChange={setMode}
			/>
		</ScreenContainer>
	);
}
