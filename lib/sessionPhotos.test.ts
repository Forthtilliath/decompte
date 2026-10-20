import {
	getAppDirectory,
	pruneAppDirectory,
} from "@forthtilliath/react-native-kit/utils/files/appFiles";
import { saveImageThumbnail } from "@forthtilliath/react-native-kit/utils/files/imageThumbnail";
import { pruneSessionPhotos, relinkSessionPhotos, saveSessionPhoto } from "@/lib/sessionPhotos";
import { makeSession } from "@/test/factories";

describe("photos des parties", () => {
	it("garde une image réduite dans le dossier des parties", async () => {
		await saveSessionPhoto("file:///cache/table.jpg");
		expect(saveImageThumbnail).toHaveBeenCalledWith("file:///cache/table.jpg", {
			directory: "parties",
			prefix: "partie",
			width: 1280,
			quality: 0.7,
		});
	});

	it("garde seulement les photos encore utilisées", () => {
		pruneSessionPhotos([
			makeSession({ photoUri: "file:///documents/parties/a.jpg" }),
			makeSession({ id: "s2" }),
		]);
		expect(pruneAppDirectory).toHaveBeenLastCalledWith("parties", [
			"file:///documents/parties/a.jpg",
		]);
	});

	it("n'échoue jamais quand le dossier est illisible", () => {
		jest.mocked(pruneAppDirectory).mockImplementationOnce(() => {
			throw new Error("illisible");
		});
		expect(() => pruneSessionPhotos([])).not.toThrow();
	});

	it("ne reprend d'une sauvegarde que les photos encore présentes dans l'app", () => {
		jest.mocked(getAppDirectory).mockReturnValueOnce({
			list: () => [{ uri: "file:///data/app/files/parties/partie-1.jpg" }],
		} as unknown as ReturnType<typeof getAppDirectory>);
		const [kept, dropped] = relinkSessionPhotos([
			makeSession({ photoUri: "file:///ancien/parties/partie-1.jpg" }),
			makeSession({ id: "s2", photoUri: "https://exemple.com/pistage.jpg" }),
		]);
		expect(kept.photoUri).toBe("file:///data/app/files/parties/partie-1.jpg");
		expect(dropped).not.toHaveProperty("photoUri");
	});
});
