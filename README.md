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

## Build de release

L'APK de release est signé avec une **clé d'upload propre à l'app**, jamais avec le `debug.keystore` public de React Native. Le plugin `plugins/withReleaseSigning.js` lit la clé dans des propriétés Gradle qui restent hors du dépôt. Sans elles, le build release échoue volontairement.

1. Créer la clé une seule fois, puis la sauvegarder hors de la machine (gestionnaire de mots de passe) : la perdre empêche toute mise à jour de l'app déjà installée.

   ```powershell
   keytool -genkeypair -v -storetype PKCS12 -keyalg RSA -keysize 2048 -validity 10000 -alias decompte-upload -keystore "$env:USERPROFILE\keys\decompte-upload.keystore"
   ```

2. Déclarer la clé dans `~/.gradle/gradle.properties`, jamais dans le projet :

   ```properties
   DECOMPTE_UPLOAD_STORE_FILE=C:/Users/<vous>/keys/decompte-upload.keystore
   DECOMPTE_UPLOAD_STORE_PASSWORD=...
   DECOMPTE_UPLOAD_KEY_ALIAS=decompte-upload
   DECOMPTE_UPLOAD_KEY_PASSWORD=...
   ```

   En CI, utiliser les variables d'environnement `ORG_GRADLE_PROJECT_DECOMPTE_UPLOAD_*` à la place.

3. Générer le projet natif, construire et vérifier la signature :

   ```powershell
   npx expo prebuild --platform android
   cd android
   .\gradlew.bat :app:signingReport
   .\gradlew.bat assembleRelease
   ```

L'APK publié se renomme avec l'app et la version, par exemple `Decompte-1.0.0.apk`. `plugins/withAndroidAbis.js` limite le build aux architectures `armeabi-v7a` et `arm64-v8a`, celles des téléphones réels.

## Licence

[MIT](LICENSE)
