# Suivi de Projet - Application Calories & Macros

## Derniere mise a jour
- Date : 8 mai 2026
- Session : 15
- Etat : pivot produit. La partie nutrition est retiree de l'application mobile. L'app devient un carnet d'entrainement centre sur la force, les seances realisees et la progression. Les appels nutrition/Claude/Open Food Facts ne sont plus utilises cote app.

---

## Objectif business
- Modele freemium : version de base gratuite + options payantes.
- Version gratuite envisagee : carnet d'entrainement, suivi des seances, progression.
- Options payantes prevues : programmes sportifs, routines personnalisees, contenus coach.
- Paiement prevu via App Store / Play Store.
- Creation de compte prevue via Apple ID / Google.
- Marches cibles : France, Espagne, Amerique Latine, puis USA.

---

## Description du projet
Application mobile de suivi d'entrainement :
- Creer des programmes de force.
- Noter les exercices, charges, series et repetitions.
- Enregistrer les seances realisees.
- Retrouver la derniere performance pour progresser d'une seance a l'autre.
- Construire plus tard une section HIIT.
- La partie nutrition est arretee pour le moment.

---

## Materiel
- Ordinateur : Samsung Galaxy Book sous Windows.
- Telephone : Samsung Galaxy Android.
- Navigateur : Microsoft Edge.

---

## Stack technique
- Mobile : React Native + Expo.
- Backend : Node.js + Express sur Railway.
- IA / nutrition : conservee dans l'historique du projet mais non utilisee par l'app mobile actuelle.
- Base nutritionnelle : conservee dans le repo mais non utilisee par l'app mobile actuelle.
- Stockage local : `@react-native-async-storage/async-storage`.
- Stockage cloud prevu plus tard : Supabase ou Firebase.
- Niveau actuel : debutant, besoin de commandes pas a pas.

---

## Fichiers importants
- `server.js` : serveur Node.js Railway, logique nutrition, appels Claude, defauts de quantite.
- `ciqual.json` : base Ciqual complete.
- `ciqual_courants.json` : aliments courants selectionnes.
- `ciqual_extras.json` : ajouts recents : legumes, plats, sauces, desserts, boissons.
- `ALIMENTS_DISPONIBLES.md` : liste lisible de tous les aliments disponibles pour Claude.
- `app/(tabs)/index.tsx` : ecran principal de l'app React Native.
- `app/(tabs)/scan.tsx` : ecran scanner code-barres.
- `app/(tabs)/_layout.tsx` : onglets de l'app.
- `.github/workflows/android-apk.yml` : build APK Android via GitHub Actions.
- `eas.json` : profils de build Expo/EAS, dont `preview` pour APK autonome.
- `package.json` / `package-lock.json` : dependances Expo/React Native, dont AsyncStorage.
- `SUIVI_PROJET_CALORIES.md` : resume de projet a coller au debut des prochaines conversations.

---

## Architecture actuelle
Flux actuel entrainement :
1. L'utilisateur ouvre l'app autonome sur le Samsung.
2. L'ecran principal affiche le carnet d'entrainement.
3. L'utilisateur choisit Force ou HIIT.
4. Force permet de creer des programmes d'entrainement.
5. Chaque programme contient des exercices.
6. Chaque exercice contient poids, blocs `series x repetitions`, rythme/repos et reglage machine.
7. L'utilisateur peut demarrer une seance aujourd'hui depuis un programme.
8. La seance reprend la derniere performance connue quand elle existe.
9. L'utilisateur modifie les resultats reels pendant ou apres la seance.
10. La seance est sauvegardee localement avec AsyncStorage.

Flux HIIT :
1. L'ecran HIIT existe comme placeholder.
2. La logique detaillee sera construite plus tard.

Flux nutrition :
1. La nutrition est retiree de l'app mobile actuelle.
2. Le code serveur nutrition et les bases restent dans le repo pour l'historique, mais l'app ne les appelle plus.

---

## Ce qui fonctionne
- App installee sur Samsung.
- APK preview autonome testee : l'app s'ouvre sans Expo, sans PC et sans adresse IP.
- Ecran principal transforme en carnet d'entrainement.
- Choix Force / HIIT.
- HIIT conserve comme placeholder.
- Force permet de creer un entrainement, par exemple pecs-epaules.
- Dans un entrainement force, on peut ajouter des exercices avec nom, poids, blocs `series x repetitions`, rythme/repos et reglage machine.
- Les exercices de force sont modifiables et supprimables.
- On peut demarrer une seance de force aujourd'hui depuis un entrainement.
- Une seance force sauvegarde les performances realisees.
- La prochaine fois, l'app affiche la derniere performance pour aider a progresser.
- Historique des seances de force.
- Sauvegarde locale avec AsyncStorage.
- Onglets nutrition/scan retires.
- Plugins camera/micro retires de `app.json`.
- APK Android construite via GitHub Actions quand Expo/EAS bloque au telechargement.
- APK preview autonome construite avec EAS pour test sans PC.
- Railway connecte a GitHub pour deploiement automatique.

---

## Historique des sessions

### Sessions 1 a 7
- Mise en place React Native + Expo.
- Mise en place serveur Node.js + Express sur Railway.
- Connexion GitHub pour deploiement automatique.
- Integration base Ciqual.
- Integration Claude Haiku pour analyser les repas.
- Premiere interface de confirmation.
- Dictee vocale avec `expo-speech-recognition`.

### Session 8 - 29 avril 2026
- Fix oeufs en pieces : Claude devait comprendre les oeufs comme unite et non comme grammes.
- Fix steak a 0 calories : nettoyage du prefixe `x` avant recalcul.
- Nouvelle interface de confirmation en colonnes.
- Fix boeuf/oeuf : eviter que `boeuf` soit detecte comme `oeuf`.
- Steak sans precision : choix par defaut `boeuf, steak hache, cuit`.
- Oeufs sans cuisson precisee : choix par defaut `oeuf, brouille, avec matiere grasse`.
- Viandes/poissons/feculents sans poids : 180g par defaut.
- Boissons sans volume : 150ml par defaut a ce moment-la.
- Incident Railway US-West rencontre puis resolu.

### Session 9 - 30 avril 2026

#### 1. Correction definitive oeuf / boeuf / ligature
- Probleme : `boeuf` et `oeuf` pouvaient etre confondus a cause de la ligature francaise et des variantes d'ecriture.
- Ajout d'une normalisation des noms : accents et ligatures sont uniformises.
- `boeuf` / `bœuf` ne declenche plus la logique `oeuf`.
- 1 oeuf est calcule comme 55g.
- Resultat attendu : 1 oeuf brouille environ 80 kcal, pas 145 kcal.

#### 2. Correction des quantites a l'unite dans l'app
- Probleme : quand on passait de 3 oeufs a 4 oeufs, l'app affichait parfois `4g` et mettait `x oeufs` dans le nom.
- Correction dans `app/(tabs)/index.tsx`.
- L'app conserve maintenant l'unite d'origine : piece, gramme ou ml.
- Si un aliment commence en pieces, la colonne quantite reste sans `g`.
- Le serveur recoit un texte propre du type `4 oeufs`, pas `4 x oeufs`.

#### 3. Valeur par defaut pour les aliments a l'unite
- Probleme : `banane` seule sortait a 0.
- Correction : un aliment a l'unite sans nombre vaut 1 par defaut.
- Valable pour les oeufs, fruits et autres aliments reconnus comme aliments a l'unite.
- Exemple : `banane` -> 1 banane.

#### 4. Ajout d'une base d'aliments supplementaires
- Creation/extension de `ciqual_extras.json`.
- Le serveur charge maintenant `ciqual.json`, `ciqual_courants.json` et `ciqual_extras.json`.
- Les aliments envoyes a Claude incluent les aliments courants + extras.
- `ALIMENTS_DISPONIBLES.md` liste maintenant tous les aliments disponibles.

#### 5. Ajouts legumes, feculents, legumes secs et plats
- Ajouts importants : haricots verts, haricots rouges, haricots blancs, flageolets, haricots coco, feves, pois gourmands, mais doux.
- Ajouts plats : ratatouille, boeuf bourguignon, moussaka, cassoulet, couscous, lasagnes, chili con carne, blanquette, pot-au-feu, hachis parmentier, quiche lorraine, gratin de pates, navarin, legumes farcis, risotto.
- Noix de cajou et pruneau ajoutes/confirmes.

#### 6. Valeurs par defaut ajoutees
- Viandes : 180g.
- Poissons : 180g.
- Feculents : 180g.
- Legumes : 150g.
- Legumes secs : 180g.
- Plats composes : 300g.
- Oeufs : pieces de 55g.
- Fruits courants : poids par piece.

#### 7. Ajout de sauces pour les pates et plats
- Ajout de sauces classiques :
  - pesto
  - bolognaise
  - sauce tomate
  - carbonara
  - bechamel
  - sauce aux fromages
  - roquefort
  - poivre
  - curry
  - basquaise / poivrons
  - barbecue
  - ketchup
  - moutarde
  - moutarde a l'ancienne
  - sauce soja
- Portions par defaut :
  - sauces riches/pates : 80g.
  - petites sauces/condiments : 30g.
- Tests valides :
  - pesto -> 30g.
  - carbonara -> 80g.
  - sauce tomate -> 80g.
  - sauce roquefort -> 80g.

#### 8. Correction frites, tiramisu et Coca-Cola
- Probleme : `frites`, `tiramisu` et `Coca-Cola` pouvaient sortir a 0 si aucune quantite n'etait precisee.
- Correction :
  - frites -> 150g par defaut.
  - tiramisu -> 100g par defaut.
  - desserts individuels reconnus -> 100g par defaut.
  - sodas -> 330ml par defaut.
  - Coca-Cola -> `cola, sucre`.
  - Coca-Cola zero/light/sans sucre -> `cola, non sucre, avec edulcorants`.
- Probleme Coca a 1772 kcal :
  - Cause probable : mauvais rapprochement avec un aliment du type chocolat a cause de la recherche floue.
  - Correction : recherche plus stricte, `cola` ne matche plus avec `chocolat`.
- Tests locaux valides :
  - `frites` -> 150g -> environ 428 kcal.
  - `une portion de frites` -> 150g -> environ 428 kcal.
  - `tiramisu` -> 100g -> 241 kcal.
  - `un tiramisu` -> 100g -> 241 kcal.
  - `Coca-Cola` -> 330ml -> environ 138 kcal.
  - `Coca-Cola zero` -> 330ml -> environ 4 kcal.
  - `verre de vin` -> 150ml -> environ 123 kcal.
  - `whisky` -> 50ml -> environ 126 kcal.

#### 9. Boissons alcoolisees
- Vin : 150ml par verre par defaut.
- Note : 150ml = 15cl. L'utilisateur avait dit 15ml, mais 15ml serait trop petit.
- Alcools forts : 50ml par verre par defaut.

#### 10. Verification technique
- `node --check server.js` : OK.
- `npx tsc --noEmit` : OK.
- `ciqual_extras.json` : JSON valide.
- Git push effectue pour declencher Railway.
- Pas de build EAS necessaire pour les corrections backend.

### Session 10 - 2-3 mai 2026

#### 1. Correction de la dictee vocale
- Probleme : si l'utilisateur faisait une pause, la dictee pouvait remplacer le texte au lieu de l'accumuler.
- Correction dans `app/(tabs)/index.tsx` :
  - accumulation du texte reconnu pendant les pauses.
  - conservation du texte final + texte intermediaire.
  - lancement/arrete du micro plus propre.
  - quand on appuie sur `Analyser`, le micro se coupe automatiquement.
  - quand on appuie sur `Recommencer`, le micro est aussi coupe et le texte est nettoye.
- Objectif : eviter que des phrases dites apres l'analyse se retrouvent dans le repas suivant.

#### 2. Affichage des macros
- Ajout des macros principales dans l'app :
  - proteines
  - glucides
  - lipides
- Sur l'ecran principal : total journalier des macros.
- Sur l'ecran de confirmation : total du repas + ligne macros par aliment.
- Les valeurs viennent deja du serveur, donc pas de nouveau cout IA.

#### 3. Corrections pates, sauces, tartines et pain
- Probleme : `carbonara` et `bolognaise` seules pouvaient sortir a 0.
- Correction : les sauces seules sont reconnues avec une portion standard de 80g.
- Le prompt Claude demande maintenant de separer :
  - `pates carbonara` -> pates + sauce carbonara.
  - `pates bolognaise` -> pates + sauce bolognaise.
  - tartines/pain avec beurre, Nutella ou beurre de cacahuete -> pain + garniture.
- Ajouts et defauts :
  - pain / tartine : 50g.
  - pain complet : 50g.
  - baguette : 50g.
  - beurre : 10g.
  - beurre de cacahuete : 20g.
  - Nutella / pate a tartiner chocolat noisette : 20g.
- Nutella est reconnu directement, pas besoin de dire obligatoirement `pate a tartiner`.

#### 4. Tests locaux des nouveaux defauts
- `carbonara` -> 80g -> environ 208 kcal.
- `bolognaise` -> 80g -> environ 88 kcal.
- `tartine` -> 50g -> environ 133 kcal.
- `pain complet` -> 50g -> environ 122 kcal.
- `beurre` -> 10g -> environ 75 kcal.
- `beurre de cacahuete` -> 20g -> environ 118 kcal.
- `Nutella` -> 20g -> environ 108 kcal.
- `tranche de pain complet` -> 50g -> environ 122 kcal.

#### 5. Ajout du scanner code-barres
- Installation de `expo-camera`.
- Ajout de la permission camera dans `app.json`.
- Creation de l'ecran `app/(tabs)/scan.tsx`.
- Ajout de l'onglet Scan dans `app/(tabs)/_layout.tsx`.
- Ajout d'une icone scan dans `components/ui/icon-symbol.tsx`.
- Le scanner lit les codes EAN/UPC.
- Le scanner appelle le serveur Railway, puis renvoie le produit scanne vers l'ecran de confirmation.

#### 6. Open Food Facts cote serveur
- Ajout d'une route backend :
```text
GET /barcode/:code
```
- Le serveur appelle Open Food Facts API v2.
- Le serveur transforme le produit en format compatible avec l'app :
  - nom
  - quantite
  - unite
  - calories
  - proteines
  - glucides
  - lipides
  - sucres
  - fibres
  - code-barres
  - source `openfoodfacts`
- Quantite par defaut :
  - portion indiquee par Open Food Facts si disponible.
  - sinon 100g.
- Open Food Facts est gratuit et suffisant au debut. A surveiller plus tard si l'app grossit fortement.

#### 7. Tests techniques apres ajout scanner
- `node --check server.js` : OK.
- `npx tsc --noEmit` : OK.
- `npx expo lint` : OK.
- Simulation locale d'un produit Open Food Facts : OK.

#### 8. Commits/push realises
- `5aafec7 fix dictee macros sauces tartines`
- `af9c8ea add barcode scanner`
- `14b4c76 add github apk build`

#### 9. Build EAS et probleme de telechargement
- Build EAS lance :
```powershell
eas build --profile development --platform android
```
- Build reussi cote Expo.
- Build ID :
```text
c58f7d4f-242f-4ad7-8d2d-0a8463dfaf9d
```
- Probleme rencontre : le telechargement de l'APK depuis Expo/Cloudflare R2 etait inaccessible depuis le PC et le telephone.
- Erreurs vues :
  - `ERR_CONNECTION_TIMED_OUT`
  - site inaccessible vers `cloudflarestorage.com`

#### 10. Contournement avec GitHub Actions
- Creation d'un workflow GitHub Actions pour construire une APK Android directement sur GitHub.
- Fichier ajoute :
```text
.github/workflows/android-apk.yml
```
- Le workflow :
  - installe Node.
  - installe Java.
  - fait `npm ci`.
  - genere le projet Android avec Expo.
  - construit une APK debug.
  - publie un artefact `CalorieApp-debug-apk`.
- Build GitHub Actions reussi en environ 18 minutes.
- L'utilisateur a pu recuperer l'APK via GitHub Actions.

#### 11. Installation APK et point important ExpoCamera
- Une premiere erreur est apparue :
```text
Cannot find native module 'ExpoCamera'
```
- Cause : l'ancienne app native etait encore installee ou connectee a un bundle JS qui utilisait `expo-camera`.
- Correction :
  - installer la nouvelle APK qui contient `expo-camera`.
  - si besoin, desinstaller l'ancienne CalorieApp avant de reinstaller.
  - relancer Expo avec le cache vide :
```powershell
cd C:\Users\arnau\CalorieApp
npx expo start --dev-client -c
```
- Le `-c` signifie vider le cache Metro/Expo.

#### 12. Etat en fin de session
- L'app semble se lancer avec la nouvelle APK.
- Le scanner a ete ajoute mais doit encore etre teste demain avec de vrais produits.
- A verifier demain :
  - autorisation camera.
  - apparition de l'onglet Scan.
  - scan Coca-Cola, yaourt, Nutella ou autre produit industriel.
  - retour du produit scanne dans l'ecran de confirmation.
  - modification de la quantite apres scan.

### Session 11 - 3 mai 2026

#### 1. Scan valide sur produits reels
- Le scan code-barres fonctionne sur le Samsung.
- Test positif avec des produits reels dont Philadelphia et boissons.
- Les produits scannes arrivent bien dans l'ecran de confirmation.
- Le bouton `Scanner un autre produit` permet maintenant d'ajouter plusieurs produits scannes dans le meme repas sans perdre le produit precedent.
- Correction du flux Scan -> Confirmation : le repas actif est conserve.

#### 2. Correction des produits scannes en ml
- Probleme : une biere scannee affichait parfois `100g` alors que Open Food Facts donnait les valeurs pour `100ml`.
- Correction : le serveur detecte mieux les boissons scannees et renvoie l'unite `ml`.
- Exemples vises :
  - biere -> ml.
  - soda -> ml.
  - boisson lactee/jus -> ml si reconnu comme boisson.

#### 3. Correction du recalcul des produits scannes
- Probleme : si un produit scanne etait modifie de `100ml` a `300ml`, les calories pouvaient tomber a 0.
- Correction dans l'app :
  - les produits scannes conservent leurs valeurs pour 100g/100ml.
  - si l'utilisateur change la quantite, l'app recalcule proportionnellement sans rappeler Claude.
- Exemple attendu :
  - biere 100ml = 67 kcal.
  - biere 300ml = environ 201 kcal.

#### 4. Warning CameraView
- Warning vu dans le terminal :
```text
The <CameraView> component does not support children.
```
- Signification : Expo conseille de ne pas mettre du contenu directement comme enfant de `CameraView`.
- Ce n'est pas une erreur bloquante.
- A corriger plus tard proprement en mettant les elements par-dessus la camera avec du positionnement absolu si besoin.

#### 5. Repas de la journee
- Ajout d'une organisation en 4 repas :
  - Petit dejeuner.
  - Dejeuner.
  - Diner.
  - Collation.
- L'utilisateur choisit le repas avant d'ajouter des aliments.
- Chaque repas affiche son total calories et macros.
- L'ecran principal affiche le total de la journee.
- Les aliments restent visibles dans chaque repas.
- La derniere ligne descriptive inutile a ete retiree, mais les noms des aliments restent visibles.

#### 6. Detail d'un repas
- Quand on ouvre un repas deja enregistre, on voit :
  - total calories du repas.
  - macros du repas.
  - liste des aliments.
- Ajout possible dans un repas deja existant avec `Ajouter a ce repas`.
- Modification possible d'un aliment deja enregistre.
- Suppression possible d'un aliment deja enregistre.
- Recalcul possible avec bouton `OK`.

#### 7. Correction fromage
- Probleme : `fromage` seul pouvait donner une portion trop grande ou un resultat peu coherent.
- Correction :
  - `fromage` sans precision -> portion standard 30g.
  - aliment par defaut : emmental/fromage moyen.
- L'objectif est d'eviter les 200g de fromage par defaut.

#### 8. Correction tartine / pain
- Probleme : `tartine de Nutella` affichait `tartine` au lieu de `pain`.
- Correction :
  - `tartine` est interprete comme pain.
  - affichage souhaite : `pain` avec 50g.
  - `tartine de Nutella` -> pain 50g + Nutella 20g.
  - `tartine de beurre` -> pain 50g + beurre 10g.
  - `tartine de beurre de cacahuete` -> pain 50g + beurre de cacahuete 20g.

#### 9. Correction liquides et verre de lait
- Probleme : `un verre de lait` pouvait sortir a 0 alors que `100ml de lait` fonctionnait.
- Correction :
  - lait sans volume ou verre de lait -> 150ml.
  - verre de liquide generique -> 150ml.
  - exception soda -> 330ml.
  - exception biere -> 330ml.
  - exception alcool fort -> 50ml.
- Objectif : garder une logique simple et coherente pour les boissons.

#### 10. Correction chips et apero
- Probleme : `chips` pouvait sortir a 0g.
- Correction chips :
  - `chips` ou `chip` -> 30g.
- Extension aux aliments d'apero / poignee :
  - cacahuetes.
  - amandes.
  - noix.
  - noisettes.
  - pistaches.
  - raisins secs.
  - abricots secs.
  - dattes.
  - figues seches.
  - fruits secs melanges.
- Portion par defaut : 30g.
- Ajouts dans `ciqual_extras.json` quand l'aliment n'etait pas disponible.

#### 11. Sauvegarde locale, remise a zero et historique
- Installation de :
```text
@react-native-async-storage/async-storage
```
- Ajout de la sauvegarde locale automatique dans `app/(tabs)/index.tsx`.
- Les repas du jour sont sauvegardes sur le telephone.
- Au redemarrage de l'app, les repas du jour sont recharges.
- Quand la date change :
  - la journee precedente est archivee.
  - la nouvelle journee repart a zero.
- Ajout d'un ecran `Historique`.
- L'historique affiche :
  - date.
  - calories de la journee.
  - macros de la journee.
  - repas remplis avec aliments.
- Limite actuelle : 30 journees conservees localement.

#### 12. Commits/push realises pendant la session
- `be98d8b fix recalcul produits scannes`
- `f4cd904 add meal sections and cheese default`
- `e2275f4 edit meal foods and fix tartines`
- `40059f2 fix drink defaults`
- `d7c749f fix chips default`
- `d617760 fix chips default`
- `ac4e1d1 fix apero handful defaults`
- `dac1b68 add local history and daily reset`

#### 13. Etat en fin de session 11
- Le code de la sauvegarde locale et de l'historique est pousse.
- La nouvelle APK Android n'a pas encore ete reconstruite.
- Comme AsyncStorage est un module natif, il faut reconstruire une APK avant de tester cette partie sur le Samsung.
- Prochaine reprise : commencer directement par le build Android.

### Session 12 - 4 mai 2026

#### 1. Reconstruction et installation Android
- Nouvelle APK Android reconstruite apres ajout d'AsyncStorage.
- Installation initiale bloquee par Android avec `Application non installee`.
- Solution : desinstaller l'ancienne CalorieApp du Samsung puis installer la nouvelle APK.
- Installation reussie ensuite.
- AsyncStorage fonctionne dans le nouveau build.

#### 2. Sauvegarde locale et historique testes
- Les repas restent enregistres localement sur le telephone.
- L'app peut recharger les repas apres fermeture/reouverture.
- Le principe de remise a zero au changement de date est conserve.
- L'historique de repas existe et peut afficher les anciennes journees archivees.

#### 3. Aliments personnels
- Ajout de `Mes aliments`.
- Un produit scanne peut etre sauvegarde comme aliment personnel.
- L'utilisateur peut le reutiliser sans rescanner.
- L'aliment garde une portion de base modifiable.
- On peut modifier nom/quantite, recalculer et supprimer un aliment personnel.
- Correction du probleme de scan `URIError: Malformed decodeURI input`.

#### 4. Objectifs nutrition
- Ajout d'un ecran `Objectifs`.
- Pour calories, proteines, glucides et lipides, l'utilisateur peut choisir :
  - Illimite.
  - Maximum.
  - Minimum.
  - Cible.
- Ajout de couleurs selon l'avancement :
  - maximum : vert sous 90%, orange proche, rouge si depasse.
  - minimum : rouge trop bas, orange proche, vert une fois atteint.
  - cible : violet sous 90%, vert autour de la cible, orange/rouge si trop haut.
- Objectifs sauvegardes localement.

#### 5. Historique modifiable
- Les anciennes journees de repas peuvent etre ouvertes.
- Dans une ancienne journee, les aliments peuvent etre :
  - modifies.
  - recalcules avec `OK`.
  - supprimes avec `X`.
- Les totaux calories/macros de la journee historique se recalculent apres modification.
- Limite actuelle : pas encore d'ajout direct d'un nouvel aliment dans une ancienne journee. A voir plus tard si necessaire.

#### 6. Pesees libres
- Ajout d'une fonction pesee dans l'ecran `Historique`.
- La pesee n'est pas obligatoire et n'est pas quotidienne.
- L'utilisateur peut ajouter une pesee seulement quand il veut.
- La date est libre : aujourd'hui ou ancienne date, par exemple `02/05/2026`.
- Format stocke : date + poids en kg.
- Les pesees sont sauvegardees localement dans `pesees`, separement des repas.
- Objectif futur : utiliser ces donnees pour afficher des graphiques d'evolution du poids.

#### 7. Correction affichage pesees / repas
- Probleme observe : une pesee seule pouvait apparaitre comme une journee a `0 kcal`, ce qui donnait l'impression que le poids etait traite comme un aliment.
- Correction locale :
  - section `Mes pesees` separee.
  - section `Journees repas` separee.
  - une pesee seule ne cree plus une fausse carte repas a 0 kcal.

#### 8. Tests realises
- TypeScript OK :
```powershell
npx tsc --noEmit
```
- Lint Expo OK :
```powershell
npx expo lint
```

#### 9. Commits/push realises pendant la session
- `make history editable and add weigh ins` pousse et deploye sur Railway.
- Correction locale restante a pousser : separation visuelle entre `Mes pesees` et `Journees repas`.
- Le fichier `SUIVI_PROJET_CALORIES.md` a ete mis a jour localement pour cette session.

#### 10. Etat en fin de session 12
- L'app mobile a maintenant :
  - repas par jour.
  - historique local.
  - historique modifiable.
  - aliments personnels.
  - objectifs calories/macros.
  - pesees libres.
- A la reprise :
  - faire un reload Expo pour tester la derniere correction.
  - pousser `app/(tabs)/index.tsx` et `SUIVI_PROJET_CALORIES.md`.
  - tester que les pesees apparaissent bien dans `Mes pesees` et pas comme repas a 0 kcal.

### Session 13 - 4 mai 2026

#### 1. Debut du module entrainements
- Ajout d'une entree `Entrainements` depuis l'ecran d'accueil.
- L'ecran `Entrainements` separe deux types :
  - Force.
  - HIIT.
- HIIT existe comme ecran placeholder pour plus tard.
- Force est la priorite actuelle.

#### 2. Entrainements de force
- L'utilisateur peut creer un entrainement de force avec un nom, par exemple `pecs-epaules`.
- Chaque entrainement contient une liste d'exercices.
- Pour chaque exercice, champs prevus :
  - nom de l'exercice, par exemple developpe couche.
  - poids souleve.
  - blocs de series et repetitions.
  - rythme : `Une serie toutes les`.
  - reglage machine.

#### 3. Blocs de series
- L'ancien champ simple `series` + `repetitions` a ete remplace par des blocs.
- Format voulu : `5 x 10` signifie 5 series de 10 repetitions.
- On peut ajouter plusieurs blocs pour un meme exercice :
  - `2 x 10`.
  - `2 x 8`.
  - `2 x 6`.
- Les anciennes donnees d'exercices sont normalisees pour rester compatibles.

#### 4. Modification des exercices
- Les exercices deja crees peuvent etre modifies directement :
  - nom.
  - poids.
  - rythme.
  - reglage machine.
  - blocs de series.
- On peut ajouter un bloc a un exercice existant.
- On peut supprimer un bloc.
- On peut supprimer un exercice.
- Objectif : suivre la progression, par exemple sur les tractions ou le developpe couche.

#### 5. Tests realises
- TypeScript OK :
```powershell
npx tsc --noEmit
```
- Lint Expo OK :
```powershell
npx expo lint
```

#### 6. Push realise
- Commit pousse sur GitHub :
  - `38d83d2 add strength training set blocks`
- Railway a lance un deploiement automatique apres le push.
- Note de collaboration pour la suite : l'assistant prepare les changements et les commandes, mais l'utilisateur effectue lui-meme les futurs `git commit` / `git push`, sauf demande explicite contraire.

#### 7. Etat en fin de session 13
- Le module Force est une premiere version fonctionnelle.
- Pas besoin de rebuild Android pour ces changements : un reload Expo suffit.
- Prochaine reprise : tester la creation d'un entrainement force complet sur le telephone.
- Verifier sur mobile :
  - creation d'un entrainement.
  - ajout d'exercice.
  - ajout de plusieurs blocs `series x repetitions`.
  - modification d'un exercice existant.
  - suppression d'un bloc et d'un exercice.

### Session 14 - 5 mai 2026

#### 1. Seances de force realisees
- Ajout d'un vrai flux de seance de force.
- Depuis un entrainement force existant, l'utilisateur peut appuyer sur `Demarrer cette seance`.
- La seance est creee pour aujourd'hui, sans programmation future.
- Pendant la seance, l'utilisateur peut saisir les resultats reels :
  - poids utilise.
  - blocs `series x repetitions`, par exemple `5 x 10`.
  - plusieurs blocs possibles, par exemple `2 x 10`, `2 x 8`, `2 x 6`.
  - rythme / repos sous forme de texte.
  - reglage machine.
- La seance peut etre terminee puis conservee dans l'historique force.

#### 2. Reprise de la derniere performance
- Quand l'utilisateur demarre a nouveau le meme entrainement, l'app cherche la derniere seance terminee.
- Les exercices de la nouvelle seance reprennent les valeurs de la derniere performance connue.
- L'ecran affiche aussi un rappel `Derniere fois`.
- Objectif : aider l'utilisateur a progresser, par exemple passer de `5 x 10 a 20 kg` a `5 x 10 a 22 kg`.

#### 3. Tests techniques
- TypeScript OK :
```powershell
npx tsc --noEmit
```
- Lint Expo OK :
```powershell
npx expo lint
```
- Git diff check OK :
```powershell
git diff --check
```

#### 4. Passage en APK autonome
- Objectif : pouvoir tester l'app pendant une semaine sans ordinateur.
- Ancien mode : development build qui demandait Expo, le PC et une adresse IP locale.
- Nouveau mode : APK preview autonome.
- Modification de `eas.json` :
  - profil `preview`.
  - `distribution: internal`.
  - `android.buildType: apk`.
  - `autoIncrement: true`.
- Build lance avec :
```powershell
eas build --profile preview --platform android
```
- Installation sur Samsung reussie.
- Android a propose `Mettre a jour cette application`, ce qui est normal : meme application, nouvelle version.
- Test valide :
  - l'app s'ouvre sans menu developpeur.
  - le telephone n'a plus besoin de se connecter a Expo.
  - plus besoin de `npx expo start`.
  - plus besoin d'adresse IP.
  - l'app peut etre utilisee hors de la maison, par exemple au restaurant.

#### 5. Limites de l'APK autonome
- L'app fonctionne sans PC, mais elle a encore besoin d'internet pour :
  - appeler le serveur Railway.
  - appeler Claude via le serveur.
  - utiliser Open Food Facts pour les scans.
- Les donnees restent en stockage local sur le telephone.
- Si l'app est desinstallee, les donnees locales peuvent etre perdues.
- Plus tard, il faudra ajouter une sauvegarde cloud avec compte utilisateur.

#### 6. Open Food Facts et produits introuvables
- Observation : un fromage espagnol scanne a donne `Produit introuvable`.
- Le scan avait bien lu le code-barres, donc ce n'etait probablement pas un probleme de cadrage.
- Cause probable : produit absent de la base Open Food Facts ou fiche incomplete.
- Estimation qualitative :
  - France / Belgique / Suisse : tres bonne couverture.
  - Espagne / Europe de l'Ouest : bonne mais plus variable.
  - USA / Canada : correcte.
  - Amerique latine : plus variable selon pays et marques.
- A prevoir plus tard :
  - afficher le code-barres exact quand le produit est introuvable.
  - proposer `Ajouter ce produit manuellement`.
  - permettre d'entrer calories/macros depuis l'etiquette.
  - associer ce produit au code-barres dans `Mes aliments`.
  - la prochaine fois, l'app reconnaitra le produit localement sans Open Food Facts.

#### 7. Etat en fin de session 14
- L'utilisateur va tester l'application en conditions reelles pendant environ une semaine.
- Il va noter :
  - bugs.
  - aliments mal reconnus.
  - scans introuvables.
  - quantites par defaut incoherentes.
  - problemes d'ergonomie.
  - ameliorations utiles au quotidien.
- A la prochaine session, transformer ce retour terrain en plan de correction priorise.

### Session 15 - 8 mai 2026

#### 1. Pivot produit
- Decision : arreter le developpement nutrition pour le moment.
- Raison : la nutrition coute trop cher et ajoute trop de complexite.
- Nouveau focus : suivi d'entrainement, prise de notes et evaluation de la progression.

#### 2. Suppression de la nutrition cote app
- Remplacement de `app/(tabs)/index.tsx` par une version entrainement-only.
- Suppression de l'experience nutrition :
  - plus d'ecran calories/macros.
  - plus de repas.
  - plus de dictee nutrition.
  - plus de scan produit.
  - plus d'historique alimentaire.
  - plus de pesees liees au module nutrition.
  - plus de `Mes aliments`.
  - plus d'objectifs nutrition.
- Les appels couteux vers Claude/Open Food Facts ne sont plus utilises par l'app.

#### 3. Suppression des onglets inutiles
- Suppression de l'onglet `Scan`.
- Suppression de l'onglet `Explore`.
- L'app garde un onglet principal centre sur l'entrainement.
- Suppression des fichiers :
  - `app/(tabs)/scan.tsx`.
  - `app/(tabs)/explore.tsx`.

#### 4. Permissions natives nettoyees
- Retrait des plugins natifs inutiles dans `app.json` :
  - `expo-speech-recognition`.
  - `expo-camera`.
- Objectif : ne plus demander camera/micro dans les futurs builds autonomes.
- Les dependances peuvent encore exister dans `package.json`, mais elles ne sont plus utilisees par le code mobile.

#### 5. Fonctionnalites conservees
- Carnet d'entrainement.
- Section Force.
- Section HIIT placeholder.
- Creation de programmes force.
- Exercices avec :
  - nom.
  - poids.
  - blocs `series x repetitions`.
  - rythme / repos.
  - reglage machine.
- Demarrage d'une seance aujourd'hui.
- Sauvegarde locale des seances.
- Historique des seances.
- Reprise de la derniere performance pour suivre la progression.

#### 6. Tests techniques
- TypeScript OK :
```powershell
npx tsc --noEmit
```
- Lint Expo OK :
```powershell
npx expo lint
```

---

## Valeurs par defaut actuelles
- Oeuf : 55g par piece.
- Orange/pomme/poire/peche : 150g.
- Banane : 120g.
- Kiwi : 80g.
- Yaourt : 125g.
- Hamburger : 180g.
- Biscuit : 15g.
- Tranche : 30g.
- Verre generique : 200g si utilise comme piece.
- Verre de liquide : 150ml.
- Tasse : 250g.
- Cuillere : 15g.
- Portion generique : 300g.
- Viandes : 180g.
- Poissons : 180g.
- Feculents : 180g.
- Legumes : 150g.
- Legumes secs : 180g.
- Plats composes : 300g.
- Frites : 150g.
- Desserts individuels : 100g.
- Pain / tartine : 50g.
- Pain complet : 50g.
- Baguette : 50g.
- Beurre : 10g.
- Beurre de cacahuete : 20g.
- Nutella / pate a tartiner chocolat noisette : 20g.
- Fromage : 30g.
- Chips : 30g.
- Cacahuetes/amandes/noix/noisettes/pistaches/fruits secs : 30g.
- Sauce pesto/ketchup/moutarde/barbecue/soja : 30g.
- Sauces standard : 80g.
- Sodas : 330ml.
- Bieres : 330ml.
- Lait / verre de lait : 150ml.
- Verre de vin : 150ml.
- Alcool fort : 50ml.

---

## Procedure de debut de session

### Mode autonome deja installe
Si l'utilisateur teste seulement l'app sur le Samsung :
- ouvrir directement CalorieApp.
- ne pas lancer Expo.
- ne pas entrer d'adresse IP.
- le PC n'a pas besoin d'etre allume.

### Mode developpement
Utiliser cette procedure seulement pour tester des changements de code en direct avec Expo.

### 1. Trouver l'adresse IP du PC
Dans PowerShell :
```powershell
ipconfig
```
Noter l'adresse IPv4, par exemple `192.168.1.140`.

### 2. Lancer Expo
```powershell
cd C:\Users\arnau\CalorieApp
npx expo start --dev-client
```

Si l'app vient d'etre reinstalllee ou si un module natif a ete ajoute, utiliser plutot :
```powershell
cd C:\Users\arnau\CalorieApp
npx expo start --dev-client -c
```
Le `-c` vide le cache Expo/Metro.

### 3. Connecter le telephone
Sur le Samsung :
1. Ouvrir CalorieApp.
2. Appuyer sur Connect.
3. Entrer :
```text
http://TON_IP:8081
```
Si Expo propose le port 8082, taper `Y` dans PowerShell puis utiliser `http://TON_IP:8082`.

Important : le telephone et le PC doivent etre sur le meme WiFi.

---

## Procedure Git / Railway
Apres une modification backend :
```powershell
cd C:\Users\arnau\CalorieApp
git status
git add server.js ciqual_extras.json ALIMENTS_DISPONIBLES.md
git commit -m "message sans accents"
git push
```
Railway redeploie automatiquement apres le push.

Lien serveur Railway :
```text
https://calorie-server-production.up.railway.app
```

Apres une modification app/documentation :
```powershell
cd C:\Users\arnau\CalorieApp
git status
git add package.json package-lock.json "app/(tabs)/index.tsx" SUIVI_PROJET_CALORIES.md
git commit -m "message sans accents"
git push
```

---

## Procedure APK Android

### APK autonome pour tester sans PC
Pour generer une APK autonome installable, sans serveur Expo local :
```powershell
cd C:\Users\arnau\CalorieApp
eas build --profile preview --platform android
```

Si Expo demande :
```text
Install and run the Android build on an emulator?
```
Repondre :
```text
n
```

Quand la build est terminee :
1. Ouvrir le lien Expo sur le Samsung.
2. Telecharger l'APK.
3. Appuyer sur `Mettre a jour` si Android le propose.
4. Ouvrir CalorieApp directement.
5. Verifier que l'app ne demande plus Expo, ni adresse IP.

### Development build EAS
Apres un changement natif Expo/Android, par exemple ajout de `expo-camera` ou `AsyncStorage` :
```powershell
cd C:\Users\arnau\CalorieApp
eas build --profile development --platform android
```

Si Expo demande :
```text
Install and run the Android build on an emulator?
```
Repondre :
```text
n
```

### Contournement si Expo/Cloudflare bloque le telechargement
Utiliser GitHub Actions :
1. Aller sur GitHub.
2. Ouvrir le repo `calorie-server`.
3. Onglet `Actions`.
4. Ouvrir `Build Android APK`.
5. Attendre le statut vert `Success`.
6. Ouvrir le run.
7. Descendre jusqu'a `Artifacts`.
8. Telecharger `CalorieApp-debug-apk`.
9. Extraire le ZIP.
10. Installer `app-debug.apk` sur le Samsung.

Important :
- Si Android refuse l'installation, desinstaller l'ancienne CalorieApp puis reinstaller la nouvelle APK.
- Apres installation, relancer Expo avec :
```powershell
cd C:\Users\arnau\CalorieApp
npx expo start --dev-client -c
```

---

## Regles importantes pour coder
- Ne jamais coller de cle API dans le code.
- Les cles restent dans les variables d'environnement Railway ou dans les fichiers personnels non commits.
- Regle Git importante : a l'avenir, l'assistant prepare les modifications et donne les commandes, mais l'utilisateur fait lui-meme `git commit` et `git push`, sauf demande explicite contraire.
- Pas besoin de build EAS pour les changements serveur.
- Build EAS seulement apres changement de code natif Expo/Android :
```powershell
eas build --profile development --platform android
```
- Faire attention a l'encodage Windows : si possible rester sans accents dans le code et les messages de commit.
- Toujours tester :
```powershell
node --check server.js
npx tsc --noEmit
```

---

## Prochains objectifs court terme

### Priorite 1 - Tester en conditions reelles pendant une semaine
- Utiliser l'APK autonome sans PC.
- Compter les repas tous les jours.
- Scanner des produits reels en France/Espagne si possible.
- Tester `Mes aliments` pour reutiliser les produits frequents.
- Tester l'historique, les pesees, les objectifs et les repas.
- Noter :
  - aliments qui sortent a 0.
  - produits scannes introuvables.
  - portions par defaut fausses.
  - bugs.
  - clics inutiles.
  - ameliorations prioritaires.

### Priorite 2 - Tester le module entrainement force
- Aller dans `Entrainements`.
- Ouvrir `Force`.
- Creer un entrainement, par exemple `pecs-epaules`.
- Ajouter un exercice, par exemple `developpe couche`.
- Tester plusieurs blocs :
  - `2 x 10`.
  - `2 x 8`.
  - `2 x 6`.
- Modifier un exercice existant.
- Supprimer un bloc.
- Supprimer un exercice.
- Demarrer une seance aujourd'hui.
- Terminer la seance.
- Redemarrer le meme entrainement et verifier que la derniere performance apparait.
- Noter les problemes d'ergonomie.

### Priorite 3 - Continuer les tests nutrition / historique / pesees
- Aller dans `Historique`.
- Ajouter une pesee d'aujourd'hui.
- Ajouter une pesee d'une ancienne date.
- Verifier que les pesees apparaissent dans `Mes pesees`.
- Verifier qu'elles ne creent pas de journee repas a 0 kcal.
- Demain, verifier que la journee d'aujourd'hui est bien archivee.
- Ouvrir une journee historique et modifier/supprimer un aliment.

### Priorite 4 - Suite module entrainement
- Ameliorer l'ergonomie de la force apres test.
- Ajouter les notes de fin d'entrainement.
- Construire ensuite la partie HIIT.

### Priorite 5 - Scan introuvable / fallback produit manuel
- Quand Open Food Facts ne trouve pas un produit :
  - afficher le code-barres.
  - proposer `Ajouter manuellement`.
  - entrer calories/macros depuis l'etiquette.
  - sauvegarder le produit localement avec son code-barres.
- Objectif : reduire les frustrations sur produits locaux, notamment Espagne et Amerique latine.

---

## Prochaines etapes apres court terme
- Ameliorer l'APK autonome apres la semaine de test.
- Sauvegarde cloud avec Supabase ou Firebase.
- Creation de compte Apple ID / Google.
- Graphiques hebdomadaires calories/macros.
- Graphique d'evolution du poids avec les pesees.
- Historique plus complet avec ajout d'aliments dans une ancienne journee si necessaire.
- Stabilisation scan code-barres avec Open Food Facts.
- Bases nutritionnelles autres langues : BEDCA pour Espagne, USDA pour USA.
- Programmes sportifs en option payante.
- Publication Play Store.

---

## Notes business
- Nom app encore a definir : pistes Fuelo, DiCal, FitFuel.
- Monetisation envisagee : gratuit pour calories, payant pour programmes sportifs autour de 5 euros/mois.
- Marketing possible : TikTok/Instagram avec videos de dictee vocale.
- Structure juridique en Espagne a voir avec un gestor : autonomo ou SL.

---

## Comment utiliser ce fichier
A chaque nouvelle conversation, coller ce fichier au debut.
Demander a l'assistant de reprendre depuis la section "Prochains objectifs court terme".
