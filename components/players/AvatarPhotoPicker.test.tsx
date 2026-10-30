import { saveImageThumbnail } from "@forthtilliath/react-native-kit/utils/files/imageThumbnail";
import { tapFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { AvatarPhotoPicker } from "@/components/players/AvatarPhotoPicker";
import { mockAlert } from "@/test/alerts";

jest.mock("@forthtilliath/react-native-kit/utils/helpers/haptics");

const { spy: alert, choose } = mockAlert();

const picked = (uri: string) =>
	({
		canceled: false,
		assets: [{ uri, width: 100, height: 100 }],
	}) as ImagePicker.ImagePickerResult;

beforeEach(() => {
	alert.mockClear();
	jest.mocked(ImagePicker.launchCameraAsync).mockClear();
	choose();
});

const renderPicker = async (avatarUri?: string) => {
	const onChange = jest.fn();
	await render(<AvatarPhotoPicker name="Alice" avatarUri={avatarUri} onChange={onChange} />);
	return onChange;
};

describe("AvatarPhotoPicker", () => {
	it("prend une photo et garde sa miniature", async () => {
		jest.mocked(ImagePicker.launchCameraAsync).mockResolvedValueOnce(picked("file:///cache/a.jpg"));
		choose("Prendre une photo");
		const onChange = await renderPicker();
		await fireEvent.press(screen.getByRole("button", { name: "Ajouter une photo du joueur" }));

		await waitFor(() => expect(onChange).toHaveBeenCalledWith("file:///documents/avatars/a.jpg"));
		expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
			expect.objectContaining({ allowsEditing: true, aspect: [1, 1] }),
		);
	});

	it("choisit une photo dans la galerie sans demander l'appareil photo", async () => {
		jest
			.mocked(ImagePicker.launchImageLibraryAsync)
			.mockResolvedValueOnce(picked("file:///cache/b.jpg"));
		jest.mocked(ImagePicker.requestCameraPermissionsAsync).mockClear();
		choose("Choisir dans la galerie");
		const onChange = await renderPicker();
		await fireEvent.press(screen.getByRole("button", { name: "Ajouter une photo du joueur" }));

		await waitFor(() => expect(onChange).toHaveBeenCalledWith("file:///documents/avatars/b.jpg"));
		expect(ImagePicker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
	});

	it("prévient quand l'appareil photo est refusé", async () => {
		jest
			.mocked(ImagePicker.requestCameraPermissionsAsync)
			.mockResolvedValueOnce({ granted: false } as ImagePicker.CameraPermissionResponse);
		choose("Prendre une photo");
		const onChange = await renderPicker();
		await fireEvent.press(screen.getByRole("button", { name: "Ajouter une photo du joueur" }));

		await waitFor(() =>
			expect(alert).toHaveBeenCalledWith("Accès à l'appareil photo refusé", expect.any(String)),
		);
		expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
		expect(onChange).not.toHaveBeenCalled();
	});

	it("ne change rien quand la prise de vue est annulée", async () => {
		choose("Prendre une photo");
		const onChange = await renderPicker();
		await fireEvent.press(screen.getByRole("button", { name: "Ajouter une photo du joueur" }));

		await waitFor(() => expect(ImagePicker.launchCameraAsync).toHaveBeenCalled());
		expect(onChange).not.toHaveBeenCalled();
	});

	it("prévient quand la photo n'a pas pu être enregistrée", async () => {
		jest.mocked(ImagePicker.launchCameraAsync).mockResolvedValueOnce(picked("file:///cache/c.jpg"));
		jest.mocked(saveImageThumbnail).mockRejectedValueOnce(new Error("disque plein"));
		choose("Prendre une photo");
		const onChange = await renderPicker();
		await fireEvent.press(screen.getByRole("button", { name: "Ajouter une photo du joueur" }));

		await waitFor(() =>
			expect(alert).toHaveBeenCalledWith("Photo non enregistrée", expect.any(String)),
		);
		expect(onChange).not.toHaveBeenCalled();
	});

	it("vibre à l'ouverture du choix", async () => {
		jest.mocked(tapFeedback).mockClear();
		await renderPicker();
		await fireEvent.press(screen.getByRole("button", { name: "Ajouter une photo du joueur" }));
		expect(tapFeedback).toHaveBeenCalledTimes(1);
	});

	it("retire la photo", async () => {
		const onChange = await renderPicker("file:///documents/avatars/a.jpg");
		expect(screen.getByRole("button", { name: "Changer la photo du joueur" })).toBeOnTheScreen();
		await fireEvent.press(screen.getByRole("button", { name: "Retirer la photo" }));
		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	it("ne propose pas de retirer une photo absente", async () => {
		await renderPicker();
		expect(screen.queryByRole("button", { name: "Retirer la photo" })).toBeNull();
	});
});
