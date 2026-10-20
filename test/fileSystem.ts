/**
 * `expo-file-system` en mémoire, pour les tests qui écrivent puis relisent de vrais fichiers :
 *
 *     jest.mock("expo-file-system", () => require("@/test/fileSystem").memoryFileSystem);
 *
 * `memoryFiles` associe chaque URI à son contenu ; `failWrites` simule un disque plein.
 */
export const memoryFiles = new Map<string, string>();
export const fileSystemControl = { failWrites: false };

type Parent = string | { uri: string };
const joinUri = (parts: Parent[]) =>
	parts.map((p) => (typeof p === "string" ? p : p.uri)).join("/");

class MemoryDirectory {
	readonly uri: string;
	constructor(...parts: Parent[]) {
		this.uri = joinUri(parts);
	}
	get exists() {
		return true;
	}
	create() {}
}

class MemoryFile {
	readonly uri: string;
	constructor(...parts: Parent[]) {
		this.uri = joinUri(parts);
	}
	get exists() {
		return memoryFiles.has(this.uri);
	}
	create() {
		if (fileSystemControl.failWrites) throw new Error("disque plein");
		memoryFiles.set(this.uri, "");
	}
	write(content: string) {
		if (fileSystemControl.failWrites) throw new Error("disque plein");
		memoryFiles.set(this.uri, content);
	}
	textSync() {
		const content = memoryFiles.get(this.uri);
		if (content === undefined) throw new Error(`fichier absent : ${this.uri}`);
		return content;
	}
}

export const memoryFileSystem = {
	File: MemoryFile,
	Directory: MemoryDirectory,
	Paths: {
		document: new MemoryDirectory("file:///documents"),
		cache: new MemoryDirectory("file:///cache"),
	},
};

export function resetMemoryFiles(): void {
	memoryFiles.clear();
	fileSystemControl.failWrites = false;
}
