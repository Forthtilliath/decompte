import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { GroupListItem } from "@/components/groups/GroupListItem";
import { PlayerListItem } from "@/components/players/PlayerListItem";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { matchesSearch, normalizeForSearch } from "@/lib/search";
import { selectSortedGroups, useGroupsStore } from "@/stores/groupsStore";
import { selectSortedPlayers, usePlayersStore } from "@/stores/playersStore";

export default function PlayersScreen() {
	const router = useRouter();
	const colors = useColors();
	const styles = useStyles(colors);
	const players = usePlayersStore((s) => s.players);
	const toggleFavorite = usePlayersStore((s) => s.toggleFavorite);
	const toggleArchived = usePlayersStore((s) => s.toggleArchived);
	const groups = useGroupsStore((s) => s.groups);
	const toggleGroupFavorite = useGroupsStore((s) => s.toggleFavorite);
	const toggleGroupArchived = useGroupsStore((s) => s.toggleArchived);
	const [query, setQuery] = useState("");

	const sorted = selectSortedPlayers(players);
	const sortedGroups = selectSortedGroups(groups);
	const needle = normalizeForSearch(query);
	const filtered = sorted.filter((p) => matchesSearch(p.name, needle));
	const addPlayer = () => router.push("/players/new");

	return (
		<ScreenContainer>
			{players.length > 0 && (
				<TextField
					placeholder="Rechercher un joueur..."
					value={query}
					onChangeText={setQuery}
					style={styles.search}
					autoCapitalize="none"
				/>
			)}
			<FlatList
				data={filtered}
				keyExtractor={(p) => p.id}
				contentContainerStyle={styles.list}
				ItemSeparatorComponent={() => <Text style={{ height: SPACING.sm }} />}
				ListHeaderComponent={
					query.length === 0 ? (
						<View style={styles.groupsSection}>
							<Text style={styles.sectionTitle}>Groupes</Text>
							{sortedGroups.map((group) => (
								<GroupListItem
									key={group.id}
									group={group}
									onPress={() => router.push(`/groups/${group.id}`)}
									onToggleFavorite={() => toggleGroupFavorite(group.id)}
									onToggleArchived={() => toggleGroupArchived(group.id)}
								/>
							))}
							<Button
								label="Nouveau groupe"
								variant="ghost"
								onPress={() => router.push("/groups/new")}
							/>
							<Text style={styles.sectionTitle}>Joueurs</Text>
						</View>
					) : undefined
				}
				ListEmptyComponent={
					query.length > 0 ? (
						<EmptyState icon="search" message="Aucun joueur ne correspond à cette recherche." />
					) : (
						<EmptyState
							icon="people-outline"
							message="Aucun joueur pour l'instant."
							action={{ label: "Ajouter un joueur", onPress: addPlayer }}
						/>
					)
				}
				renderItem={({ item }) => (
					<PlayerListItem
						player={item}
						onPress={() => router.push(`/players/${item.id}`)}
						onToggleFavorite={() => toggleFavorite(item.id)}
						onToggleArchived={() => toggleArchived(item.id)}
					/>
				)}
			/>
			{/* Sans joueur, le bouton est déjà dans l'état vide. */}
			{players.length > 0 && (
				<Button label="Ajouter un joueur" onPress={addPlayer} style={styles.addButton} />
			)}
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				search: {
					marginBottom: SPACING.md,
				},
				list: {
					paddingBottom: SPACING.md,
				},
				addButton: {
					marginTop: SPACING.md,
				},
				groupsSection: {
					gap: SPACING.sm,
					marginBottom: SPACING.sm,
				},
				sectionTitle: {
					color: colors.textMuted,
					fontSize: 14,
					textTransform: "uppercase",
					letterSpacing: 0.5,
				},
			}),
		[colors],
	);
}
