# Suivi de Projet - Application Calories & Macros

## Derniere mise a jour
- Date : 3 mai 2026
- Session : 11
- Etat : code pousse avec repas, scan multiple, defauts apero, sauvegarde locale et historique. Nouvelle APK Android a reconstruire avant de tester AsyncStorage.

---

## Objectif business
- Modele freemium : version de base gratuite + options payantes.
- Version gratuite : comptage de calories, repas, historique, macros.
- Options payantes prevues : programmes sportifs.
- Paiement prevu via App Store / Play Store.
- Creation de compte prevue via Apple ID / Google.
- Marches cibles : France, Espagne, Amerique Latine, puis USA.

---

## Description du projet
Application mobile de suivi nutritionnel :
- Compter les calories journalieres.
- Classer par macronutriments : proteines, glucides, lipides, sucres, fibres.
- Dictee vocale pour saisir un repas.
- Journal alimentaire jour par jour.
- Historique des repas.
- Scan code-barres avec Open Food Facts, ajoute et a tester sur produits reels.

---

## Materiel
- Ordinateur : Samsung Galaxy Book sous Windows.
- Telephone : Samsung Galaxy Android.
- Navigateur : Microsoft Edge.

---

## Stack technique
- Mobile : React Native + Expo.
- Backend : Node.js + Express sur Railway.
- IA : API Claude Haiku pour interpreter la dictee vocale.
- Base nutritionnelle principale : Ciqual 2020.
- Base courte envoyee a Claude : aliments courants + extras.
- Fichier extras : `ciqual_extras.json`.
- Scan produit : `expo-camera` cote app + Open Food Facts cote serveur.
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
- `package.json` / `package-lock.json` : dependances Expo/React Native, dont AsyncStorage.
- `SUIVI_PROJET_CALORIES.md` : resume de projet a coller au debut des prochaines conversations.

---

## Architecture actuelle
1. L'utilisateur dicte ou tape son repas.
2. L'app envoie le texte au serveur Railway.
3. Le serveur envoie a Claude la dictee + la liste des aliments disponibles.
4. Claude choisit un nom exact dans la liste et extrait quantite + unite.
5. Le serveur applique les valeurs par defaut si la quantite est absente.
6. Le serveur cherche l'aliment dans les index Ciqual/extras.
7. Le serveur renvoie calories + macros.
8. L'app affiche l'ecran de confirmation avec modification possible.

Flux scan :
1. L'utilisateur ouvre l'onglet Scan.
2. L'app demande l'autorisation camera.
3. L'app lit le code-barres.
4. L'app appelle le serveur Railway sur `/barcode/:code`.
5. Le serveur interroge Open Food Facts.
6. Le serveur transforme le produit en format compatible avec l'app : nom, calories, proteines, glucides, lipides, quantite.
7. L'app renvoie le produit scanne vers l'ecran de confirmation.

Flux repas / sauvegarde locale :
1. L'utilisateur choisit un repas : petit dejeuner, dejeuner, diner ou collation.
2. Il ajoute des aliments par dictee, saisie texte ou scan.
3. Il confirme, les aliments sont ajoutes au repas choisi.
4. L'app sauvegarde automatiquement les repas du jour dans le stockage local du telephone.
5. Quand la date change, l'ancienne journee est archivee et la nouvelle journee repart a zero.
6. L'ecran Historique affiche les anciennes journees avec calories, macros et aliments.

---

## Ce qui fonctionne
- App installee sur Samsung en development build.
- Ecran principal avec compteur de calories.
- Saisie manuelle d'un repas.
- Dictee vocale continue amelioree : le texte s'accumule pendant les pauses.
- Le micro se coupe automatiquement quand on lance l'analyse.
- Analyse de plusieurs aliments en une seule dictee.
- Interface de confirmation avec colonnes Aliment / Quantite / Calories.
- Macros visibles : proteines, glucides, lipides sur l'ecran principal et l'ecran de confirmation.
- Modification d'un aliment puis bouton OK pour recalculer.
- Suppression d'un aliment avec bouton X.
- Ajout manuel d'un aliment avec bouton +.
- Calories et macros renvoyees par le serveur.
- Base Ciqual + extras fonctionnelle.
- Onglet Scan fonctionnel avec Open Food Facts.
- Possibilite de scanner plusieurs produits dans le meme repas sans perdre les produits deja ajoutes.
- Produits scannes recalcules proportionnellement quand on modifie la quantite.
- Boissons scannees gerees en ml quand Open Food Facts indique une boisson.
- Quatre repas disponibles : petit dejeuner, dejeuner, diner, collation.
- Detail d'un repas avec total calories/macros et liste des aliments.
- Dans un repas deja enregistre, on peut modifier un aliment, recalculer avec OK ou supprimer avec X.
- Sauvegarde locale ajoutee avec AsyncStorage.
- Historique simple ajoute : les journees precedentes sont archivees localement.
- Remise a zero automatique prevue au changement de date.
- APK Android construite via GitHub Actions quand Expo/EAS bloque au telechargement.
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

### Cas normal : build EAS
Apres un changement natif Expo/Android, par exemple ajout de `expo-camera` ou `AsyncStorage` :
```powershell
cd C:\Users\arnau\CalorieApp
eas build --profile development --platform android
```

Pour la prochaine reprise, commencer ici :
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

### Priorite 1 - Reconstruire l'APK Android
- Faire le build Android parce que `AsyncStorage` est un module natif.
- Installer la nouvelle APK sur le Samsung.
- Si le telechargement Expo bloque encore, utiliser GitHub Actions comme contournement.
- Relancer ensuite Expo avec cache vide :
```powershell
cd C:\Users\arnau\CalorieApp
npx expo start --dev-client -c
```

### Priorite 2 - Tester sauvegarde locale et historique
- Ajouter un petit dejeuner.
- Fermer l'app.
- Rouvrir l'app.
- Verifier que le petit dejeuner est toujours la.
- Ajouter dejeuner/diner/collation.
- Verifier que les totaux journee sont corrects.
- Tester l'ecran Historique.
- Tester le changement de jour des que possible.

### Priorite 3 - Tester en conditions reelles pendant une semaine
- Utiliser l'app tous les jours pour compter les calories.
- Noter les aliments qui sortent a 0.
- Noter les produits scannes mal reconnus.
- Noter les portions par defaut qui semblent fausses.
- Verifier si l'app est assez pratique au quotidien.

### Priorite 4 - Preparation mode autonome sans PC
- Aujourd'hui l'app en dev client peut encore demander Expo/Metro selon le mode de lancement.
- Pour tester au restaurant sans PC, il faudra passer a une APK preview/standalone avec le JavaScript integre.
- A faire quand les repas + historique sont suffisamment stables.

---

## Prochaines etapes apres court terme
- APK preview/standalone pour utiliser l'app sans ordinateur.
- Sauvegarde cloud avec Supabase ou Firebase.
- Creation de compte Apple ID / Google.
- Historique plus complet avec selection par date.
- Objectifs calories/macros personnels.
- Graphiques hebdomadaires.
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
