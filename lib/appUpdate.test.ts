import { fetchLatestRelease } from "@/lib/appUpdate";

type ReleaseFixture = {
	tag_name: string;
	draft?: boolean;
	body?: string | null;
	assets?: { name: string; browser_download_url: string }[];
};

function release({ draft = false, body = "notes", assets, ...rest }: ReleaseFixture) {
	const version = rest.tag_name.replace(/^v/, "");
	return {
		...rest,
		draft,
		body,
		assets: assets ?? [
			{
				name: `Decompte-${version}.apk`,
				browser_download_url: `https://github.com/Forthtilliath/decompte/releases/download/${rest.tag_name}/Decompte-${version}.apk`,
			},
		],
	};
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

	it("ignore les brouillons, les releases sans APK et les APK hors github.com", async () => {
		mockGithub([
			release({ tag_name: "v3.0.0", draft: true }),
			release({ tag_name: "v2.1.0", assets: [] }),
			release({
				tag_name: "v2.0.0",
				assets: [
					{ name: "Decompte.apk", browser_download_url: "https://exemple.com/Decompte.apk" },
				],
			}),
			release({ tag_name: "v1.2.0", body: null }),
		]);
		await expect(fetchLatestRelease()).resolves.toEqual({
			version: "1.2.0",
			notes: "",
			apkUrl:
				"https://github.com/Forthtilliath/decompte/releases/download/v1.2.0/Decompte-1.2.0.apk",
		});
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
