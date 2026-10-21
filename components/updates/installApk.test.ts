import { File } from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { installApk } from "@/components/updates/installApk";

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
const DOWNLOADS = "https://github.com/Forthtilliath/decompte/releases/download";
const APK_URL = `${DOWNLOADS}/v9.0.0/Decompte-9.0.0.apk`;

beforeEach(() => jest.clearAllMocks());

describe("installApk", () => {
	it("installe un APK dont l'empreinte correspond à celle annoncée par GitHub", async () => {
		mockDigest = SHA256;
		await installApk(APK_URL, undefined, SHA256);
		expect(IntentLauncher.startActivityAsync).toHaveBeenCalledWith(
			"android.intent.action.VIEW",
			expect.objectContaining({ type: "application/vnd.android.package-archive" }),
		);
	});

	it("supprime sans l'installer un APK à l'empreinte différente", async () => {
		mockDigest = "c".repeat(64);
		await expect(installApk(APK_URL, undefined, SHA256)).rejects.toThrow("SHA-256");
		expect(mockDelete).toHaveBeenCalled();
		expect(IntentLauncher.startActivityAsync).not.toHaveBeenCalled();
	});

	it.each([
		["sans empreinte", APK_URL, undefined],
		["d'un autre dépôt", "https://github.com/autre/depot/releases/download/v1/a.apk", SHA256],
		["en http", APK_URL.replace("https", "http"), SHA256],
		["qui sort du dossier des releases", `${DOWNLOADS}/../../autre/a.apk`, SHA256],
		["avec un caractère encodé", `${DOWNLOADS}/v1/%2e%2e/a.apk`, SHA256],
	])("refuse un APK %s, avant tout téléchargement", async (_, url, sha256) => {
		await expect(installApk(url, undefined, sha256)).rejects.toThrow();
		expect(File.createDownloadTask).not.toHaveBeenCalled();
		expect(IntentLauncher.startActivityAsync).not.toHaveBeenCalled();
	});
});
