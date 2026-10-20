import * as IntentLauncher from "expo-intent-launcher";
import { installApk } from "@/components/updates/installApk";
import { fetchLatestRelease } from "@/lib/appUpdate";

// Ni téléchargement ni installeur sous Jest : le fichier téléchargé a l'empreinte `mockDigest`.
let mockDigest = "";
const mockDelete = jest.fn();
jest.mock("expo-file-system", () => {
	class MockFile {
		exists = false;
		contentUri = "content://cache/decompte-update.apk";
		delete = mockDelete;
		digest = jest.fn(() => Promise.resolve(mockDigest));
		static createDownloadTask = jest.fn(() => ({
			downloadAsync: () => Promise.resolve(new MockFile()),
		}));
	}
	return { File: MockFile, Paths: { cache: "cache" } };
});
jest.mock("expo-intent-launcher", () => ({ startActivityAsync: jest.fn(() => Promise.resolve()) }));

const SHA256 = "b".repeat(64);
const APK_URL =
	"https://github.com/Forthtilliath/decompte/releases/download/v9.0.0/Decompte-9.0.0.apk";

beforeAll(async () => {
	jest.spyOn(globalThis, "fetch").mockResolvedValue({
		ok: true,
		json: async () => [
			{
				tag_name: "v9.0.0",
				draft: false,
				body: "",
				assets: [
					{ name: "Decompte-9.0.0.apk", browser_download_url: APK_URL, digest: `sha256:${SHA256}` },
				],
			},
		],
	} as Response);
	await fetchLatestRelease();
});

beforeEach(() => jest.clearAllMocks());

describe("installApk", () => {
	it("installe un APK dont l'empreinte correspond à celle annoncée par GitHub", async () => {
		mockDigest = SHA256;
		await installApk(APK_URL);
		expect(IntentLauncher.startActivityAsync).toHaveBeenCalledWith(
			"android.intent.action.VIEW",
			expect.objectContaining({ type: "application/vnd.android.package-archive" }),
		);
	});

	it("supprime sans l'installer un APK à l'empreinte différente", async () => {
		mockDigest = "c".repeat(64);
		await expect(installApk(APK_URL)).rejects.toThrow("empreinte différente");
		expect(mockDelete).toHaveBeenCalled();
		expect(IntentLauncher.startActivityAsync).not.toHaveBeenCalled();
	});

	it("refuse une adresse hors des releases du dépôt, avant tout téléchargement", async () => {
		await expect(
			installApk("https://github.com/autre/depot/releases/download/v1/a.apk"),
		).rejects.toThrow("Adresse");
		await expect(
			installApk("https://github.com/Forthtilliath/decompte/releases/download/v1/inconnu.apk"),
		).rejects.toThrow("Empreinte");
		expect(IntentLauncher.startActivityAsync).not.toHaveBeenCalled();
	});
});
