import type { z } from "zod";
import { keepRescueCopy } from "@/lib/rescueCopies";
import { reportDataIssue } from "@/stores/dataIssuesStore";

/**
 * Conversions d'un store persisté : `steps[v]` transforme l'état enregistré en version `v` en état
 * de la version `v + 1`. Toute hausse de version d'un store ajoute son étape, jamais d'effacement :
 * un test vérifie qu'aucune ne manque (lib/persistedState.test.ts).
 */
export type MigrationSteps = Readonly<Record<number, (state: unknown) => unknown>>;

/**
 * Applique les étapes une à une de `from` à `to` : un utilisateur qui a sauté des mises à jour
 * passe par toutes. Lève une erreur si une étape manque ou si `from` est plus récente que `to`.
 */
export function runMigrationSteps(
	state: unknown,
	from: number,
	to: number,
	steps: MigrationSteps,
): unknown {
	if (from > to) throw new Error(`version ${from} plus récente que ${to}`);
	let migrated = state;
	for (let version = from; version < to; version++) {
		const step = steps[version];
		if (!step) throw new Error(`aucune migration de la version ${version} à ${version + 1}`);
		migrated = step(migrated);
	}
	return migrated;
}

/**
 * Option `migrate` du middleware `persist` de Zustand. L'état enregistré est d'abord copié tel quel
 * (lib/rescueCopies), puis converti étape par étape. Si la conversion est impossible, le store
 * démarre vide, mais la copie garde les données et l'utilisateur est prévenu : rien n'est jamais
 * effacé en silence. Le résultat passe ensuite par `validatedMerge`.
 */
export function createStoreMigrate<S>(
	storeName: string,
	currentVersion: number,
	steps: MigrationSteps,
	emptyState: S,
) {
	return (persisted: unknown, version: number): S => {
		if (version === currentVersion || persisted === undefined || persisted === null) {
			return (persisted ?? emptyState) as S;
		}
		const copy = keepRescueCopy(storeName, version, persisted, "avant-migration");
		try {
			return runMigrationSteps(persisted, version, currentVersion, steps) as S;
		} catch {
			reportDataIssue({
				storeName,
				kind: version > currentVersion ? "newer" : "migration",
				copyUri: copy.uri,
			});
			return emptyState;
		}
	};
}

/**
 * Option `merge` du middleware `persist` de Zustand : l'état relu d'AsyncStorage (et converti par
 * `migrate`) passe par `schema` au lieu d'un simple cast. Ce sont les données de l'app elle-même,
 * mais un stockage abîmé (écriture interrompue, modification extérieure…) ou une migration fautive
 * ne doivent ni faire planter les écrans, ni passer pour des données valides.
 *
 * Refusé, le store démarre vide et le contenu brut est gardé en copie de secours, puisque la
 * prochaine modification réécrira la clé du store ; l'utilisateur en est prévenu une fois, à la
 * création de la copie (sauf `report: false`, pour les réglages propres à l'appareil). Accepté,
 * l'état est repris tel qu'enregistré : pas de suppression des clés inconnues, un schéma en retard
 * sur un type effacerait ce champ à chaque lancement.
 */
export function validatedMerge<P extends object>(
	storeName: string,
	version: number,
	schema: z.ZodType,
	{ report = true }: { report?: boolean } = {},
) {
	return <S extends P>(persisted: unknown, current: S): S => {
		if (persisted === undefined || persisted === null) return current;
		if (schema.safeParse(persisted).success) return { ...current, ...(persisted as P) };
		const copy = keepRescueCopy(storeName, version, persisted, "refuse");
		if (report && copy.created) reportDataIssue({ storeName, kind: "invalid", copyUri: copy.uri });
		return current;
	};
}
