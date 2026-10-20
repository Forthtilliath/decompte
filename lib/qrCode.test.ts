import { buildQrMatrix, qrPath, toAsciiJson } from "@/lib/qrCode";

describe("toAsciiJson", () => {
	it("échappe les accents et emojis, relus à l'identique par JSON.parse", () => {
		const json = JSON.stringify({ name: "Trésor 🏆", label: "Œuvre" });
		const ascii = toAsciiJson(json);
		expect([...ascii].every((c) => c.charCodeAt(0) >= 0x20 && c.charCodeAt(0) <= 0x7e)).toBe(true);
		expect(JSON.parse(ascii)).toEqual({ name: "Trésor 🏆", label: "Œuvre" });
	});
});

describe("buildQrMatrix", () => {
	it("donne une matrice carrée, avec les trois repères de coin", () => {
		const matrix = buildQrMatrix("decompte");
		expect(matrix).not.toBeNull();
		if (!matrix) return;
		expect(matrix.every((row) => row.length === matrix.length)).toBe(true);
		const last = matrix.length - 1;
		expect([matrix[0][0], matrix[0][last], matrix[last][0]]).toEqual([true, true, true]);
	});

	it("renonce à un texte trop long pour un QR code", () => {
		expect(buildQrMatrix("x".repeat(3000))).toBeNull();
	});
});

describe("qrPath", () => {
	it("trace un carré par module noir, décalé de la marge", () => {
		expect(
			qrPath(
				[
					[true, false],
					[false, true],
				],
				4,
			),
		).toBe("M4,4h1v1h-1zM5,5h1v1h-1z");
	});
});
