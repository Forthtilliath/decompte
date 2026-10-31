/// <reference types="node" />
// `npm run demo:backup [-- <fichier>]` (dist/decompte-demo.json par défaut) : écrit une sauvegarde
// de démonstration, à restaurer sur l'émulateur pour les captures du README (docs/README.md).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildDemoBackup } from "./demoBackup.ts";

const file = process.argv[2] ?? "dist/decompte-demo.json";
const backup = buildDemoBackup();
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, JSON.stringify(backup));
console.log(
	`${file} : ${backup.games.length} jeux, ${backup.players.length} joueurs, ${backup.sessions.length} parties`,
);
