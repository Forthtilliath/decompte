import qrcode from "qrcode-generator";

const BACKSLASH = String.fromCharCode(92);

/**
 * JSON en ASCII pur : chaque caractère hors ASCII imprimable devient sa séquence d'échappement JSON
 * (« é » → barre oblique inverse, `u00e9`), lue à l'identique par `JSON.parse`. Le contenu d'un QR
 * code n'a ainsi aucun encodage à deviner (Latin-1 ou UTF-8) à la lecture.
 */
export function toAsciiJson(json: string): string {
	return json.replace(
		/[^\x20-\x7e]/g,
		(char) => `${BACKSLASH}u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
	);
}

/** Modules d'un QR code (`true` = noir), ou `null` si le texte ne tient pas dans le plus grand. */
export function buildQrMatrix(text: string): boolean[][] | null {
	// Correction d'erreur minimale : le plus de place pour le texte, l'écran d'un téléphone se
	// lit sans abîmes ni taches.
	const qr = qrcode(0, "L");
	try {
		qr.addData(text, "Byte");
		qr.make();
	} catch {
		return null;
	}
	const size = qr.getModuleCount();
	return Array.from({ length: size }, (_, row) =>
		Array.from({ length: size }, (_, col) => qr.isDark(row, col)),
	);
}

/** Tracé SVG des modules noirs (un carré d'une unité chacun), décalé de `margin` unités. */
export function qrPath(matrix: boolean[][], margin: number): string {
	return matrix
		.flatMap((cells, row) =>
			cells.flatMap((dark, col) => (dark ? [`M${col + margin},${row + margin}h1v1h-1z`] : [])),
		)
		.join("");
}
