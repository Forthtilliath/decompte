import { readFileSync } from "node:fs";
import { bumpAppJson, isBumpArg } from "@/scripts/version";

const appJson = readFileSync(`${__dirname}/../app.json`, "utf8");

describe("isBumpArg", () => {
	it.each(["prerelease", "patch", "minor", "major", "1.0.0", "1.0.0-alpha.9"])(
		"accepte %s",
		(arg) => {
			expect(isBumpArg(arg)).toBe(true);
		},
	);

	it.each(["", "1.0", "v1.0.0", "patch && echo", "1.0.0; rm -rf"])("refuse %j", (arg) => {
		expect(isBumpArg(arg)).toBe(false);
	});
});

describe("bumpAppJson", () => {
	it("reporte la version et incrémente le versionCode sans toucher au reste", () => {
		const before = JSON.parse(appJson).expo;
		const { text, versionCode } = bumpAppJson(appJson, "9.9.9");

		const after = JSON.parse(text).expo;
		expect(versionCode).toBe(before.android.versionCode + 1);
		expect(after).toEqual({
			...before,
			version: "9.9.9",
			android: { ...before.android, versionCode },
		});
		// Une seule ligne change pour chacune des deux valeurs.
		const changed = text.split("\n").filter((line, i) => line !== appJson.split("\n")[i]);
		expect(changed).toHaveLength(2);
	});

	it("échoue si le versionCode est absent", () => {
		expect(() => bumpAppJson('{ "expo": { "version": "1.0.0" } }', "1.0.1")).toThrow(/versionCode/);
	});

	it("échoue si une autre clé « version » rend le remplacement ambigu", () => {
		const ambiguous = JSON.stringify({
			expo: { version: "1.0.0", android: { versionCode: 1 }, extra: { version: "x" } },
		});
		expect(() => bumpAppJson(ambiguous, "1.0.1")).toThrow(/occurrence/);
	});
});
