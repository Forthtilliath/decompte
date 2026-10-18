# Décompte

Compteur de scores universel pour jeux de société, sur Android. Vous décrivez une fois la feuille de score d'un jeu, puis l'app guide la saisie catégorie par catégorie et calcule le classement. Tout reste sur le téléphone : ni compte, ni réseau.

## Fonctionnalités

- **Feuilles de score personnalisables** : chaque jeu se compose de catégories, chacune avec son mode de calcul :
  - **points saisis** à la main, négatifs et plafond en option ;
  - **jetons** pondérés à compter (ex. jetons de victoire 1, 3, 5), additionnés automatiquement ;
  - **choix** parmi des options à score fixe (ex. palier atteint) ;
  - **oui / non**, chaque réponse avec son propre score.
- **Saisie guidée** : une catégorie à la fois, avec le total de chaque joueur affiché en continu.
- **Partie en cours sauvegardée** : on la reprend à l'étape où on l'avait laissée, ou on l'abandonne.
- **Classement final** avec médailles, et ex æquo gérés.
- **Joueurs et groupes** : avatar photo ou initiales colorées, groupes d'habitués.
- **Historique** des parties, avec le détail des scores par catégorie, et la possibilité de rejouer une partie avec les mêmes joueurs.
- **Partage de jeux** : un jeu s'envoie en texte à un autre joueur, qui le colle dans Décompte. Le texte est entièrement vérifié avant d'être ajouté.
- Thème clair ou sombre.
- Rien n'est supprimé définitivement : jeux, joueurs et groupes s'archivent, pour que l'historique reste lisible.

## Stack

- [Expo](https://docs.expo.dev/versions/v57.0.0/) SDK 57, React Native 0.86, React 19, TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) (navigation par fichiers, dossier `app/`)
- [Zustand](https://zustand.docs.pmnd.rs/) + AsyncStorage pour la persistance locale
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

- **Logique pure** (`lib/*.test.ts`) : classement, déroulé d'une partie, validation du formulaire de jeu, import d'un jeu partagé.
- **Stores** (`stores/*.test.ts`) : actions, et persistance (clé de stockage, version, réhydratation). C'est ce qui protège les données déjà enregistrées sur les téléphones lors d'une mise à jour de Zustand ou d'AsyncStorage.
- **Composants et parcours** (`components/**/*.test.tsx`, `test/flows/`) : les vrais écrans avec la vraie navigation Expo Router (créer un jeu, jouer, reprendre une partie, rejouer depuis l'historique, importer un jeu…).

Sur chaque pull request vers `main`, la CI lance le lint, les types, les tests, `expo-doctor` et un audit des failles critiques. Quand les dépendances ou `app.json` changent, un second workflow compile l'APK release et vérifie qu'il n'est jamais signé avec la clé de debug et qu'il ne contient aucune permission bloquée.

Après une montée de version (`npx expo install --fix`), `npm run check` doit passer avant d'ouvrir la PR.

## Structure

| Dossier | Contenu |
|---|---|
| `app/` | Écrans (Expo Router) : onglets Jeux, Historique, Joueurs, Réglages |
| `components/` | Composants : `ui/` génériques, `scoring/` saisie des scores, `games/`, `players/`, `groups/`, `history/` |
| `stores/` | États Zustand persistés : jeux, joueurs, groupes, partie en cours, historique, thème |
| `lib/` | Logique pure : calcul des scores, déroulé d'une partie, validation et import des jeux |
| `test/` | Outils de test (fabriques de données, rendu de l'app entière) et parcours de bout en bout |

## Sécurité

Les APK publiés sont signés avec une clé propre à l'app, jamais avec la clé de debug publique de React Native. Une mise à jour ne peut donc venir que de ce projet.

## Licence

[MIT](LICENSE)
