# Suivi de Projet - Application Calories & Macros

## Derniere mise a jour
- Date : 30 avril 2026
- Session : 9
- Etat : backend Railway deploye via GitHub, app Android en development build

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
- Scan QR code / code-barres a venir avec Open Food Facts.

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
- Stockage utilisateur prevu : Supabase ou Firebase.
- Niveau actuel : debutant, besoin de commandes pas a pas.

---

## Fichiers importants
- `server.js` : serveur Node.js Railway, logique nutrition, appels Claude, defauts de quantite.
- `ciqual.json` : base Ciqual complete.
- `ciqual_courants.json` : aliments courants selectionnes.
- `ciqual_extras.json` : ajouts recents : legumes, plats, sauces, desserts, boissons.
- `ALIMENTS_DISPONIBLES.md` : liste lisible de tous les aliments disponibles pour Claude.
- `app/(tabs)/index.tsx` : ecran principal de l'app React Native.
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

---

## Ce qui fonctionne
- App installee sur Samsung en development build.
- Ecran principal avec compteur de calories.
- Saisie manuelle d'un repas.
- Dictee vocale continue, mais elle doit encore etre fiabilisee.
- Analyse de plusieurs aliments en une seule dictee.
- Interface de confirmation avec colonnes Aliment / Quantite / Calories.
- Modification d'un aliment puis bouton OK pour recalculer.
- Suppression d'un aliment avec bouton X.
- Ajout manuel d'un aliment avec bouton +.
- Calories et macros renvoyees par le serveur.
- Base Ciqual + extras fonctionnelle.
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
- Sauce pesto/ketchup/moutarde/barbecue/soja : 30g.
- Sauces standard : 80g.
- Sodas : 330ml.
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

### Priorite 1 - Fixer la dictee
- Probleme actuel : la dictee peut remplacer le texte au lieu de l'accumuler.
- Objectif : accumuler les morceaux de phrase proprement.
- Eviter les doublons si la reconnaissance renvoie plusieurs resultats intermediaires.
- Garder un bouton simple : appuyer pour demarrer, appuyer pour arreter.

### Priorite 2 - Faire apparaitre les macros dans l'app
- Afficher proteines, glucides, lipides, sucres, fibres.
- Afficher les macros par aliment dans l'ecran de confirmation.
- Afficher un total macros pour le repas.
- Plus tard : afficher un total macros journalier.

---

## Prochaines etapes apres court terme
- Journal alimentaire jour par jour.
- Remise a zero automatique a minuit.
- Sauvegarde cloud avec Supabase ou Firebase.
- Creation de compte Apple ID / Google.
- Scan code-barres avec Open Food Facts.
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
