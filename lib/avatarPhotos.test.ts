import {
	deleteFileQuietly,
	pruneAppDirectory,
} from "@forthtilliath/react-native-kit/utils/files/appFiles";
import { saveImageThumbnail } from "@forthtilliath/react-native-kit/utils/files/imageThumbnail";
import { deleteAvatarPhoto, pruneAvatarPhotos, saveAvatarPhoto } from "@/lib/avatarPhotos";
import { makePlayer } from "@/test/factories";

describe("photos d'avatar", () => {
	it("garde une miniature dans le dossier des avatars", async () => {
		await expect(saveAvatarPhoto("file:///cache/photo.jpg")).resolves.toBe(
			"file:///documents/avatars/photo.jpg",
		);
		expect(saveImageThumbnail).toHaveBeenCalledWith("file:///cache/photo.jpg", {
			directory: "avatars",
			prefix: "avatar",
		});
	});

	it("supprime la photo d'un joueur", () => {
		deleteAvatarPhoto("file:///documents/avatars/a.jpg");
		expect(deleteFileQuietly).toHaveBeenCalledWith("file:///documents/avatars/a.jpg");
	});

	it("garde seulement les photos encore utilisées", () => {
		pruneAvatarPhotos([
			makePlayer({ avatarUri: "file:///documents/avatars/a.jpg" }),
			makePlayer({ avatarUri: undefined }),
		]);
		expect(pruneAppDirectory).toHaveBeenLastCalledWith("avatars", [
			"file:///documents/avatars/a.jpg",
		]);
	});

	it("n'échoue jamais quand le dossier est illisible", () => {
		jest.mocked(pruneAppDirectory).mockImplementationOnce(() => {
			throw new Error("illisible");
		});
		expect(() => pruneAvatarPhotos([])).not.toThrow();
	});
});
