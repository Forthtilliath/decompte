import { fetchLatestRelease } from "@/lib/appUpdate";

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
	it("prend la plus haute version, pre-releases comprises, avec l'empreinte de son APK", async () => {
		const fetchSpy = mockGithub([
			release({ tag_name: "v1.0.0-alpha.2" }),
			release({ tag_name: "v1.0.0-alpha.10", body: null }),
			release({ tag_name: "v1.0.0-alpha.1" }),
			release({ tag_name: "v3.0.0", draft: true }),
		]);
		await expect(fetchLatestRelease()).resolves.toEqual({
			version: "1.0.0-alpha.10",
			notes: "",
			apkUrl: `${DOWNLOADS}/v1.0.0-alpha.10/Decompte-1.0.0-alpha.10.apk`,
			apkSha256: SHA256,
		});
		expect(String(fetchSpy.mock.calls[0]?.[0])).not.toContain("/latest");
	});

	it.each([
		["sans empreinte SHA-256", apkAsset("v2.0.0", { digest: null })],
		["avec une empreinte MD5", apkAsset("v2.0.0", { digest: "md5:abc" })],
		[
			"hors des releases du dépôt",
			apkAsset("v2.0.0", { browser_download_url: "https://github.com/autre/depot/a.apk" }),
		],
	])("ne propose pas un APK %s", async (_, asset) => {
		mockGithub([release({ tag_name: "v2.0.0", assets: [asset] }), release({ tag_name: "v1.0.0" })]);
		await expect(fetchLatestRelease()).resolves.toBeNull();
	});

	it("renvoie null sans release exploitable", async () => {
		mockGithub([release({ tag_name: "v2.2.0", assets: [] })]);
		await expect(fetchLatestRelease()).resolves.toBeNull();

		mockGithub({ message: "Not Found" });
		await expect(fetchLatestRelease()).resolves.toBeNull();
	});

	it("échoue sur une réponse d'erreur", async () => {
		mockGithub({}, false);
		await expect(fetchLatestRelease()).rejects.toThrow("500");
	});
});
