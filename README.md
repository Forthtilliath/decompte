# Décompte

Compteur de scores universel pour jeux de société, sur Android. Vous décrivez une fois la feuille de score d'un jeu, puis l'app guide la saisie catégorie par catégorie et calcule le classement. Les données restent sur le téléphone, sans compte à créer ; une sauvegarde sur Google Drive est proposée en option.

## Fonctionnalités

- **Feuilles de score personnalisables** : chaque jeu se compose de catégories, chacune avec sa couleur (au choix parmi 18) et son mode de calcul :
  - **points saisis** à la main, négatifs et plafond en option ;
  - **jetons** pondérés à compter (ex. jetons de victoire 1, 3, 5), additionnés automatiquement ;
  - **choix** parmi des options à score fixe (ex. palier atteint) ;
  - **oui / non**, chaque réponse avec son propre score.
- **Saisie guidée** : une catégorie à la fois, avec le total de chaque joueur affiché en continu.
- **Partie en cours sauvegardée** : on la reprend à l'étape où on l'avait laissée, ou on l'abandonne.
- **Classement final** avec médailles, et ex æquo gérés.
- **Joueurs et groupes** : avatar photo ou initiales colorées, groupes d'habitués.
- **Historique** des parties, avec le détail des scores par catégorie, et la possibilité de rejouer une partie avec les mêmes joueurs.
- **Graphiques d'une partie** (résultats et historique) : répartition des points de chaque joueur, comparaison des joueurs catégorie par catégorie.
- **Statistiques**, tous jeux confondus ou pour un jeu : records (meilleur score, plus longue série de victoires, partie la plus serrée), taux de victoire, jeux les plus joués, et pour chaque joueur ses points moyens et leur répartition par catégorie, en graphique ou en tableau, avec comparaison entre deux joueurs.
- **Partage de jeux** : un jeu s'envoie en texte à un autre joueur, qui le colle dans Décompte, couleurs des catégories comprises. Le texte est entièrement vérifié avant d'être ajouté.
- **Sauvegarde** : envoi automatique sur Google Drive après chaque changement (dossier privé de l'app, chiffrement en option), ou export et restauration d'un fichier, avec annulation de la dernière restauration. Chaque sauvegarde est entièrement vérifiée avant d'être appliquée.
- **Mises à jour en un geste** : l'app annonce une nouvelle version publiée sur GitHub, la télécharge et lance son installation. L'historique des versions et de leurs nouveautés est dans Réglages.
- **Réglages** : apparence, sauvegarde, mises à jour, soutien au projet (don, partage, signalement de bug), à propos, effacement des données.
- Thème clair ou sombre, avec une couleur de fond au choix pour chacun (bleu nuit, tapis vert, acajou, ardoise ; carton, blanc, sauge, rose poudré).
- Rien n'est supprimé définitivement : jeux, joueurs et groupes s'archivent, pour que l'historique reste lisible.

## Stack

- [Expo](https://docs.expo.dev/versions/v58.0.0/) SDK 58, React Native 0.88, React 19, TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) (navigation par fichiers, dossier `app/`)
- [Zustand](https://zustand.docs.pmnd.rs/) + AsyncStorage pour la persistance locale
- [react-native-gifted-charts](https://gifted-charts.web.app/) (camemberts, sur `react-native-svg`)
- [Biome](https://biomejs.dev/) pour le lint et le formatage
- [Jest](https://jestjs.io/) (preset `jest-expo`) et [Testing Library](https://callstack.github.io/react-native-testing-library/) pour les tests
- Briques partagées de [`forthtilliath-packages`](https://github.com/Forthtilliath/forthtilliath-packages) : `@forthtilliath/react-native-kit`, `@forthtilliath/ts-kit`, `@forthtilliath/expo-config-plugins`

## Développement

Prérequis : Node.js LTS, Android Studio (SDK et émulateur) ou un téléphone Android en mode développeur.

```bash
npm install
npm run android   # build natif et lancement sur l'émulateur ou le téléphone
npm start         # serveur Metro seul, une fois l'app installée
npm run lint      # vérification Biome
npm run typecheck # vérification des types
npm test          # tests (npm run test:watch, npm run test:coverage)
npm run doctor    # compatibilité des dépendances avec le SDK Expo
npm run check     # tout ce qui précède, comme la CI
```

## Tests et CI

Trois niveaux de tests, lancés par `npm test` :

- **Logique pure** (`lib/*.test.ts`) : classement, déroulé d'une partie, validation du formulaire de jeu, import d'un jeu partagé, lecture d'une sauvegarde, recherche de mise à jour.
- **Stores** (`stores/*.test.ts`) : actions, et persistance (clé de stockage, version, réhydratation). C'est ce qui protège les données déjà enregistrées sur les téléphones lors d'une mise à jour de Zustand ou d'AsyncStorage.
- **Composants et parcours** (`components/**/*.test.tsx`, `test/flows/`) : les vrais écrans avec la vraie navigation Expo Router (créer un jeu, jouer, reprendre une partie, rejouer depuis l'historique, importer un jeu…).

Sur chaque pull request vers `main`, la CI lance le lint, les types, les tests, `expo-doctor` et un audit des failles critiques. Quand les dépendances ou `app.json` changent, un second workflow compile l'APK release et vérifie qu'il n'est jamais signé avec la clé de debug et qu'il ne contient aucune permission bloquée.

Après une montée de version (`npx expo install --fix`), `npm run check` doit passer avant d'ouvrir la PR.

## Structure

| Dossier | Contenu |
|---|---|
| `app/` | Écrans (Expo Router) : onglets Jeux, Joueurs, Historique, Stats, Réglages |
| `components/` | Composants : `ui/` génériques, `scoring/` saisie des scores, `games/`, `players/`, `groups/`, `history/` |
| `stores/` | États Zustand persistés : jeux, joueurs, groupes, partie en cours, historique, thème |
| `lib/` | Logique pure : calcul des scores, déroulé d'une partie, validation et import des jeux |
| `test/` | Outils de test (fabriques de données, rendu de l'app entière) et parcours de bout en bout |

## Sauvegarde Google Drive : configuration

Assurée par [`@forthtilliath/expo-backup`](https://github.com/Forthtilliath/forthtilliath-packages/tree/main/packages/expo-backup#readme) et son écran `@forthtilliath/expo-backup-ui`. La connexion à Google ne fonctionne qu'une fois l'app déclarée dans Google Cloud (à faire une fois) :

1. [Console Google Cloud](https://console.cloud.google.com/) : activer **Google Drive API** dans un projet.
2. **Écran de consentement OAuth** : type Externe, scope `.../auth/drive.appdata` uniquement, sans logo (un logo ou un scope plus large impose une vérification par Google).
3. **Identifiants ▸ ID client OAuth ▸ Android** : package `com.forthtilliath.decompte` et SHA-1 de la clé de signature release (`keytool -list -v -keystore <clé>`). Un client par clé : un build de debug a besoin du sien.

`oauth-misconfigured` à la connexion signifie que l'étape 3 ne correspond pas à l'APK installé ; `drive-api-disabled`, que l'étape 1 manque.

## Publier une version

La mise à jour intégrée compare la version de l'app (`version` de `package.json` et `app.json`, identiques, vérifié par un test) au tag de la release GitHub la plus haute, pre-releases comprises. Pour chaque version :

1. Monter `version` dans `package.json` et `app.json`, et `android.versionCode` dans `app.json`.
2. Créer la release `v<version>` avec l'APK nommé `Decompte-<version>.apk`. Les notes de release s'affichent dans Réglages ▸ Mises à jour.

## Sécurité

Les APK publiés sont signés avec une clé propre à l'app, jamais avec la clé de debug publique de React Native. Une mise à jour ne peut donc venir que de ce projet : Android refuse d'installer par-dessus l'app un APK signé avec une autre clé. La mise à jour intégrée ne télécharge que depuis github.com, en HTTPS, et Android demande toujours confirmation avant l'installation.

La sauvegarde automatique d'Android est désactivée (`allowBackup: false`) : seule la sauvegarde de l'app, vérifiée et éventuellement chiffrée, copie les données hors du téléphone.

## Licence

[MIT](LICENSE)
