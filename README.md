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
- Thème clair ou sombre.
- Rien n'est supprimé définitivement : jeux, joueurs et groupes s'archivent, pour que l'historique reste lisible.

## Stack

- [Expo](https://docs.expo.dev/versions/v57.0.0/) SDK 57, React Native 0.86, React 19, TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) (navigation par fichiers, dossier `app/`)
- [Zustand](https://zustand.docs.pmnd.rs/) + AsyncStorage pour la persistance locale
- [Biome](https://biomejs.dev/) pour le lint et le formatage

## Développement

Prérequis : Node.js LTS, Android Studio (SDK et émulateur) ou un téléphone Android en mode développeur.

```bash
npm install
npm run android   # build natif et lancement sur l'émulateur ou le téléphone
npm start         # serveur Metro seul, une fois l'app installée
npm run lint      # vérification Biome
npx tsc --noEmit  # vérification des types
```

## Structure

| Dossier | Contenu |
|---|---|
| `app/` | Écrans (Expo Router) : onglets Jeux, Historique, Joueurs, Réglages |
| `components/` | Composants : `ui/` génériques, `scoring/` saisie des scores, `games/`, `players/`, `groups/`, `history/` |
| `stores/` | États Zustand persistés : jeux, joueurs, groupes, partie en cours, historique, thème |
| `lib/` | Logique pure : calcul des scores, déroulé d'une partie, jetons, dates |
| `plugins/` | Plugins de configuration Expo appliqués au projet Android |

## Sécurité

Les APK publiés sont signés avec une clé propre à l'app, jamais avec la clé de debug publique de React Native. Une mise à jour ne peut donc venir que de ce projet.

## Licence

[MIT](LICENSE)
