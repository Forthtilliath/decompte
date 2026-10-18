const formatter = new Intl.DateTimeFormat("fr-FR", {
	day: "2-digit",
	month: "long",
	year: "numeric",
});

/** Date lisible d'une partie, ex. "19 octobre 2026". */
export function formatDate(timestamp: number): string {
	return formatter.format(new Date(timestamp));
}
