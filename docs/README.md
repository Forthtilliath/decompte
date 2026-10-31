# Décompte : README développeurs

Tout ce qu'il faut pour travailler sur le code de Décompte. La présentation de l'app (fonctionnalités, captures) est dans le [README principal](../README.md).

## Sommaire

- [Stack](#stack)
- [Démarrer](#démarrer)
- [Structure du projet](#structure-du-projet)
- [Modèle de données](#modèle-de-données)
- [Tests et CI](#tests-et-ci)
- [Sauvegarde Google Drive : configuration](#sauvegarde-google-drive--configuration)
- [Publier une version](#publier-une-version)
- [Sécurité](#sécurité)
- [Captures d'écran du README](#captures-décran-du-readme)

## Stack

- [Expo](https://docs.expo.dev/versions/v58.0.0/) SDK 58, React Native 0.88, React 19, TypeScript, Android uniquement
- [Expo Router](https://docs.expo.dev/router/introduction/) : navigation par fichiers, dossier `app/`
- [Zustand](https://zustand.docs.pmnd.rs/) + AsyncStorage pour la persistance locale, avec migrations versionnées
- [zod](https://zod.dev/) pour valider tout ce qui entre : sauvegardes, jeux partagés, état persisté
- [react-native-gifted-charts](https://gifted-charts.web.app/) (sur `react-native-svg`) pour les graphiques
- [react-native-android-widget](https://github.com/sAleksovski/react-native-android-widget) pour le widget d'écran d'accueil
- [Biome](https://biomejs.dev/) pour le lint et le formatage
- [Jest](https://jestjs.io/) (preset `jest-expo`) et [Testing Library](https://callstack.github.io/react-native-testing-library/) pour les tests
- Briques partagées de [`forthtilliath-packages`](https://github.com/Forthtilliath/forthtilliath-packages) : `@forthtilliath/react-native-kit`, `@forthtilliath/ts-kit`, `@forthtilliath/expo-backup` (+ `-ui`), `@forthtilliath/expo-release-updates` (+ `-ui`), `@forthtilliath/expo-config-plugins`, et pour les tests `@forthtilliath/test-kit` et `@forthtilliath/expo-test-kit`

## Démarrer

Prérequis : Node.js LTS, Android Studio (SDK et émulateur) ou un téléphone Android en mode développeur.

```bash
npm install
npm run android   # build natif et lancement sur l'émulateur ou le téléphone
npm start         # serveur Metro seul, une fois l'app installée
npm run lint      # vérification Biome (npm run format pour corriger)
npm run typecheck # vérification des types
npm test          # tests (npm run test:watch, npm run test:coverage)
npm run doctor    # compatibilité des dépendances avec le SDK Expo
npm run check     # tout ce qui précède, comme la CI
```

Le schéma de liens profonds est `decompte://` : `adb shell am start -a android.intent.action.VIEW -d "decompte:///reglages/sauvegarde"` ouvre directement un écran.

## Structure du projet

| Dossier | Contenu |
|---|---|
| `app/` | Écrans (Expo Router) : onglets Jeux (liste, fiche, éditeur, modèles, import, scanner, saisie `play/`), Joueurs, Historique, Stats, Réglages ; écrans `players/`, `groups/`, `history/` hors onglets |
| `components/` | `ui/` génériques, `scoring/` saisie des scores, `games/`, `players/`, `groups/`, `history/`, `stats/` graphiques et statistiques, `settings/`, `updates/` |
| `stores/` | États Zustand persistés : jeux, joueurs, groupes, partie en cours, historique, thème, tri de la liste des jeux |
| `lib/` | Logique pure, testée à part : calcul des scores et du classement, manches, équipes, jetons, multiplicateurs, statistiques, validation et import des jeux, format de sauvegarde, export CSV, QR code, mise à jour |
| `constants/` | Thèmes et fonds, modèles de jeux (`gameTemplates*.ts`) |
| `hooks/` | Hooks partagés (couleurs du thème, partie en cours, suppression d'un jeu…) |
| `types/` | Types du domaine (`GameDef`, `Session`, `Player`…) |
| `widget/` | Widget d'écran d'accueil Android (affichage et tâche de fond, enregistrée dans `index.ts`) |
| `scripts/` | `bump-version.ts` (montée de version) et `demo-backup.ts` (sauvegarde de démonstration pour les captures), voir plus bas |
| `test/` | Outils de test (fabriques de données, rendu de l'app entière) et parcours de bout en bout (`test/flows/`) |
| `docs/` | Ce fichier et les captures du README principal |

## Modèle de données

Types dans [`types/game.ts`](../types/game.ts) et [`types/player.ts`](../types/player.ts).

- Un **jeu** (`GameDef`) a des catégories (`CategoryDef`), chacune avec un `id` stable, une couleur et une brique de calcul (`manual`, `tokens`, `choice`, `boolean`, `product`). L'`id` d'une catégorie ne change jamais, même renommée ou déplacée : c'est lui qui garde valides les parties déjà jouées.
- Une **partie** (`Session`) range les scores par joueur et par **clé de score** : l'id de la catégorie pour la manche 1, `<id>#<manche>` pour les suivantes ([`lib/rounds.ts`](../lib/rounds.ts)). Les règles de classement et les manches ouvertes sont recopiées du jeu au lancement : modifier le jeu ne reclasse pas l'historique.
- Rien ne se supprime vraiment : jeux, joueurs et groupes s'archivent (`isArchived`). Un jeu ne se supprime que s'il n'a aucune partie dans l'historique.
- Les **modèles** de jeux sont écrits au format d'un jeu partagé ([`lib/gameExportSchema.ts`](../lib/gameExportSchema.ts)) et passent par le même import vérifié ; un test s'assure qu'ils restent valides.

## Tests et CI

Trois niveaux de tests, lancés par `npm test` :

- **Logique pure** (`lib/*.test.ts`) : classement, manches, déroulé d'une partie, statistiques, validation du formulaire de jeu, import d'un jeu partagé, lecture d'une sauvegarde, recherche de mise à jour.
- **Stores** (`stores/*.test.ts`) : actions, et persistance (clé de stockage, version, migrations, réhydratation). C'est ce qui protège les données déjà enregistrées sur les téléphones lors d'une mise à jour de Zustand ou d'AsyncStorage.
- **Composants et parcours** (`components/**/*.test.tsx`, `test/flows/`) : les vrais écrans avec la vraie navigation Expo Router (créer un jeu, jouer, reprendre une partie, rejouer depuis l'historique, importer un jeu…).

Sur chaque pull request vers `main` ([`ci.yml`](../.github/workflows/ci.yml)), la CI lance le lint, les types, les tests, `expo-doctor` et un audit des failles critiques. Quand les dépendances ou `app.json` changent, un second workflow ([`android-build.yml`](../.github/workflows/android-build.yml)) compile l'APK release et vérifie qu'il n'est jamais signé avec la clé de debug et qu'il ne contient aucune permission bloquée.

Après une montée de version (`npx expo install --fix`), `npm run check` doit passer avant d'ouvrir la PR.

## Sauvegarde Google Drive : configuration

Assurée par [`@forthtilliath/expo-backup`](https://github.com/Forthtilliath/forthtilliath-packages/tree/main/packages/expo-backup#readme) et son écran `@forthtilliath/expo-backup-ui`, branchés dans [`lib/backup.ts`](../lib/backup.ts). Le format de sauvegarde est décrit et validé par [`lib/backupSchema.ts`](../lib/backupSchema.ts) : à tout changement incompatible, incrémenter `BACKUP_DATA_VERSION` en gardant une migration depuis l'ancien format.

La connexion à Google ne fonctionne qu'une fois l'app déclarée dans Google Cloud (à faire une fois) :

1. [Console Google Cloud](https://console.cloud.google.com/) : activer **Google Drive API** dans un projet.
2. **Écran de consentement OAuth** : type Externe, scope `.../auth/drive.appdata` uniquement, sans logo (un logo ou un scope plus large impose une vérification par Google).
3. **Identifiants ▸ ID client OAuth ▸ Android** : package `com.forthtilliath.decompte` et SHA-1 de la clé de signature release (`keytool -list -v -keystore <clé>`). Un client par clé : un build de debug a besoin du sien.

`oauth-misconfigured` à la connexion signifie que l'étape 3 ne correspond pas à l'APK installé ; `drive-api-disabled`, que l'étape 1 manque.

## Publier une version

La mise à jour intégrée compare la version de l'app (`version` de `package.json` et `app.json`, identiques, vérifié par un test) au tag de la release GitHub la plus haute, pre-releases comprises. Pour chaque version :

1. `npm run bump` monte `version` dans `package.json`, `package-lock.json` et `app.json`, et `android.versionCode` dans `app.json` (pre-release suivante par défaut, ou `npm run bump -- patch|minor|major|x.y.z`).
2. Installer l'APK release sur un téléphone et faire le tour de l'app (partie, Stats, photo, Drive, sauvegarde, mise à jour) : R8 réduit le code Java en release, et une classe retirée à tort ne plante qu'à l'exécution. Une règle `-keep` s'ajoute dans `extraProguardRules` d'`expo-build-properties` (`app.json`).
3. Créer la release `v<version>` avec l'APK nommé `Decompte-<version>.apk`. Les notes de release s'affichent dans Réglages ▸ Mises à jour.

Notes pour le build local :

- L'APK publié ne contient que `arm64-v8a` et `armeabi-v7a` : il plante au lancement sur un émulateur x86_64. Pour tester la release sur l'émulateur, construire une variante à part (`gradlew assembleRelease -PreactNativeArchitectures=x86_64`), à ne jamais publier.
- Sous Windows, si `:react-native-reanimated:buildCMakeRelWithDebInfo` échoue sur un `mkdir` (chemin de plus de 260 caractères), indiquer une version récente de CMake dans `android/local.properties` (`cmake.dir=…\\Sdk\\cmake\\4.1.2`) : son ninja gère les chemins longs. `expo prebuild` efface ce réglage.

## Sécurité

Les APK publiés sont signés avec une clé propre à l'app, jamais avec la clé de debug publique de React Native. Une mise à jour ne peut donc venir que de ce projet : Android refuse d'installer par-dessus l'app un APK signé avec une autre clé. La mise à jour intégrée ne télécharge qu'un APK des releases de ce dépôt, en HTTPS, vérifie son empreinte SHA-256 (calculée par GitHub) avant de l'installer, et Android demande toujours confirmation.

Tout ce qui entre dans l'app est validé par un schéma zod (types, bornes, longueurs) et rejeté en entier à la première anomalie, clés inconnues supprimées : sauvegardes (fichier ou Drive), jeux partagés (texte ou QR code), état persisté relu au démarrage.

Une app sans données (réinstallée, données perdues) n'écrase pas une sauvegarde Google Drive qui contient des données : l'envoi est bloqué jusqu'à une restauration ou une confirmation dans Réglages ▸ Sauvegarde.

La sauvegarde automatique d'Android est désactivée (`allowBackup: false`) : seule la sauvegarde de l'app, vérifiée et éventuellement chiffrée, copie les données hors du téléphone.

L'appareil photo (avatars, photo de la table, lecture d'un QR code) est demandé au premier usage, sans micro (`RECORD_AUDIO` bloquée). Les photos restent dans le dossier privé de l'app et ne partent dans aucune sauvegarde. L'export CSV neutralise les formules qu'un nom ou une note pourrait cacher (`=`, `+`, `-`, `@` en tête de cellule).

## Captures d'écran du README

Les captures de [`docs/screenshots/`](screenshots/) viennent de l'émulateur Pixel 6 (1080 × 2400), réduites à 540 × 1200 :

1. Générer la sauvegarde de démonstration (8 joueurs, 3 groupes, 7 jeux et 38 parties fictifs, toujours les mêmes) avec `npm run demo:backup` (écrite dans `dist/decompte-demo.json`, ou `npm run demo:backup -- <fichier>`), la copier sur l'émulateur (`adb push dist/decompte-demo.json /sdcard/Download/`) puis la restaurer par Réglages ▸ Sauvegarde ▸ Importer une sauvegarde. Un test (`scripts/demoBackup.test.ts`) vérifie qu'elle passe toujours la validation de l'app.
2. Passer la barre d'état en mode démo pour une heure et des icônes fixes, sans notifications :
   ```bash
   adb shell settings put global sysui_demo_allowed 1
   adb shell am broadcast -a com.android.systemui.demo -e command enter
   adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 2030
   adb shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false
   ```
3. Capturer chaque écran : `adb shell screencap -p /sdcard/s.png` puis `adb pull /sdcard/s.png`.
4. Quitter le mode démo : `adb shell am broadcast -a com.android.systemui.demo -e command exit`.
