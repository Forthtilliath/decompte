/// <reference types="node" />
// `npm run bump [-- <major|minor|patch|prerelease|x.y.z-…>]` (prerelease par défaut) : monte la
// version de package.json, package-lock.json et app.json, et android.versionCode, sans commit.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { bumpAppJson, isBumpArg } from "./version.ts";

const arg = process.argv[2] ?? "prerelease";
if (!isBumpArg(arg)) {
	console.error(
		`Argument invalide : "${arg}". Attendu : major, minor, patch, prerelease ou x.y.z.`,
	);
	process.exit(1);
}

// Argument vérifié ci-dessus : il ne peut rien injecter dans la commande.
execSync(`npm version ${arg} --no-git-tag-version`, { stdio: "ignore" });
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const { text, versionCode } = bumpAppJson(readFileSync("app.json", "utf8"), version);
writeFileSync("app.json", text);
console.log(`Version ${version} (versionCode ${versionCode})`);
