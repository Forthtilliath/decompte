import { expectedApkSha256, fetchLatestRelease, isReleaseApkUrl } from "@/lib/appUpdate";

type AssetFixture = { name: string; browser_download_url: string; digest?: string | null };

type ReleaseFixture = {
	tag_name: string;
	draft?: boolean;
	body?: string | null;
	assets?: AssetFixture[];
};

const SHA256 = "a".repeat(64);
const DOWNLOADS = "https://github.com/Forthtilliath/decompte/releases/download";

function apkAsset(tag: string, overrides: Partial<AssetFixture> = {}): AssetFixture {
	const version = tag.replace(/^v/, "");
	return {
		name: `Decompte-${version}.apk`,
		browser_download_url: `${DOWNLOADS}/${tag}/Decompte-${version}.apk`,
		digest: `sha256:${SHA256}`,
		...overrides,
	};
}

function release({ draft = false, body = "notes", assets, ...rest }: ReleaseFixture) {
	return { ...rest, draft, body, assets: assets ?? [apkAsset(rest.tag_name)] };
}

function mockGithub(body: unknown, ok = true) {
	return jest
		.spyOn(globalThis, "fetch")
		.mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body } as Response);
}

afterEach(() => jest.restoreAllMocks());

describe("fetchLatestRelease", () => {
	it("prend la plus haute version, pre-releases comprises", async () => {
		mockGithub([
			release({ tag_name: "v1.0.0-alpha.2" }),
			release({ tag_name: "v1.0.0-alpha.10" }),
			release({ tag_name: "v1.0.0-alpha.1" }),
		]);
		await expect(fetchLatestRelease()).resolves.toMatchObject({ version: "1.0.0-alpha.10" });
	});

	it("ignore les brouillons, les releases sans APK et les APK hors des releases du dépôt", async () => {
		mockGithub([
			release({ tag_name: "v3.0.0", draft: true }),
			release({ tag_name: "v2.2.0", assets: [] }),
			release({
				tag_name: "v2.1.0",
				assets: [
					apkAsset("v2.1.0", {
						browser_download_url: "https://github.com/autre/depot/releases/download/v2.1.0/a.apk",
					}),
				],
			}),
			release({
				tag_name: "v2.0.0",
				assets: [apkAsset("v2.0.0", { browser_download_url: "https://exemple.com/Decompte.apk" })],
			}),
			release({ tag_name: "v1.2.0", body: null }),
		]);
		await expect(fetchLatestRelease()).resolves.toEqual({
			version: "1.2.0",
			notes: "",
			apkUrl: `${DOWNLOADS}/v1.2.0/Decompte-1.2.0.apk`,
		});
	});

	it("ignore un APK dont GitHub ne donne pas l'empreinte SHA-256", async () => {
		mockGithub([
			release({ tag_name: "v2.0.0", assets: [apkAsset("v2.0.0", { digest: null })] }),
			release({ tag_name: "v1.9.0", assets: [apkAsset("v1.9.0", { digest: "md5:abc" })] }),
			release({ tag_name: "v1.0.0" }),
		]);
		await expect(fetchLatestRelease()).resolves.toMatchObject({ version: "1.0.0" });
	});

	it("retient l'empreinte de l'APK proposé, pour vérifier le téléchargement", async () => {
		mockGithub([release({ tag_name: "v4.0.0" })]);
		const latest = await fetchLatestRelease();
		expect(expectedApkSha256(latest?.apkUrl ?? "")).toBe(SHA256);
		expect(expectedApkSha256(`${DOWNLOADS}/v0.0.1/Decompte-0.0.1.apk`)).toBeUndefined();
	});

	it("renvoie null sans release exploitable", async () => {
		mockGithub([]);
		await expect(fetchLatestRelease()).resolves.toBeNull();
	});

	it("échoue sur une réponse d'erreur ou mal formée", async () => {
		mockGithub({}, false);
		await expect(fetchLatestRelease()).rejects.toThrow("500");

		mockGithub({ message: "Not Found" });
		await expect(fetchLatestRelease()).rejects.toThrow();
	});
});

describe("isReleaseApkUrl", () => {
	it("accepte un APK attaché à une release du dépôt", () => {
		expect(isReleaseApkUrl(`${DOWNLOADS}/v1.0.0-alpha.8/Decompte-1.0.0-alpha.8.apk`)).toBe(true);
	});

	it.each([
		["un autre dépôt", "https://github.com/Forthtilliath/autre/releases/download/v1/a.apk"],
		["http", "http://github.com/Forthtilliath/decompte/releases/download/v1/a.apk"],
		[
			"un autre hôte",
			"https://github.com.exemple.com/Forthtilliath/decompte/releases/download/v1/a.apk",
		],
		["un segment ..", `${DOWNLOADS}/../../../autre/releases/download/v1/a.apk`],
		["un sous-dossier", `${DOWNLOADS}/v1/x/a.apk`],
		["un paramètre", `${DOWNLOADS}/v1/a.apk?x=1`],
		["un caractère encodé", `${DOWNLOADS}/v1/%2e%2e/a.apk`],
		["autre chose qu'un APK", `${DOWNLOADS}/v1/a.zip`],
	])("refuse %s", (_, url) => {
		expect(isReleaseApkUrl(url)).toBe(false);
	});
});
