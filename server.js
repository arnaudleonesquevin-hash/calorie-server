const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const ciqual = JSON.parse(fs.readFileSync('./ciqual.json', 'utf8'));
const courants = JSON.parse(fs.readFileSync('./ciqual_courants.json', 'utf8'));
const extras = fs.existsSync('./ciqual_extras.json') ? JSON.parse(fs.readFileSync('./ciqual_extras.json', 'utf8')) : [];
const alimentsCourants = [...courants, ...extras];
const alimentsRecherche = [...extras, ...courants, ...ciqual];
const indexCiqual = {};
for (const a of ciqual) indexCiqual[a.nom] = a;
const indexCourants = {};
for (const a of alimentsCourants) indexCourants[a.nom] = a;

const listePourClaude = alimentsCourants.map(a => a.nom).join('\n');

const poidsPiece = {
  'oeuf': 55, 'orange': 150, 'pomme': 150, 'banane': 120,
  'kiwi': 80, 'poire': 150, 'peche': 150, 'hamburger': 180,
  'biscuit': 15, 'tranche': 30, 'yaourt': 125, 'verre': 200,
  'tasse': 250, 'cuillere': 15, 'portion': 300
};

function normaliserNom(nom) {
  return (nom || '')
    .toLowerCase()
    .replace(/\u0153/g, 'oe')
    .replace(/\u00e6/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const VIANDES = ['boeuf', 'b\u0153uf', 'steak', 'bifteck', 'poulet', 'porc', 'agneau', 'dinde', 'veau', 'canard', 'lapin', 'merguez', 'chipolata', 'saucisse', 'toulouse', 'escalope', 'cuisse', 'filet', 'rosbif', 'rumsteck', 'entrecote', 'entrecôte', 'gigot', 'cote', 'côte'];
const POISSONS = ['saumon', 'cabillaud', 'thon', 'maquereau', 'truite', 'lieu', 'dorade', 'sardine', 'crevette', 'poisson', 'pave', 'pav\u00e9'];
const FECULENTS = ['pate', 'p\u00e2te', 'riz', 'couscous', 'quinoa', 'boulgour', 'lentille', 'pois chiche', 'polenta', 'semoule', 'haricot rouge', 'haricots rouges', 'haricot blanc', 'haricots blancs', 'flageolet', 'flageolets', 'haricot coco', 'haricots coco', 'feve', 'feves', 'f\u00e8ve', 'f\u00e8ves', 'mais doux', 'ma\u00efs doux'];
const BOISSONS = ['jus', 'vin', 'rhum', 'vodka', 'whisky', 'panache', 'panach\u00e9', 'boisson', 'eau de vie', 'cognac', 'armagnac'];
const LEGUMES = ['haricot vert', 'haricots verts', 'brocoli', 'tomate', 'carotte', 'courgette', 'chou', 'oignon', 'poivron', 'concombre', 'endive', 'poireau', 'asperge', 'artichaut', 'aubergine', 'fenouil', 'betterave', 'navet', 'radis', 'potiron', 'salade', 'epinard', '\u00e9pinard', 'champignon', 'pois gourmand', 'pois gourmands', 'pois mange-tout'];
const PLATS_COMPOSES = ['ratatouille', 'bourguignon', 'moussaka', 'cassoulet', 'couscous au poulet', 'couscous royal', 'lasagne', 'lasagnes', 'chili', 'blanquette', 'pot-au-feu', 'hachis', 'parmentier', 'quiche', 'gratin', 'navarin', 'legumes farcis', 'l\u00e9gumes farcis', 'risotto'];
const SAUCES_PETITES = ['pesto', 'ketchup', 'moutarde', 'barbecue', 'sauce soja', 'nuoc mam', 'nuoc-mam'];
const SAUCES_STANDARD = ['carbonara', 'bolognaise', 'tomate', 'bechamel', 'b\u00e9chamel', 'fromage', 'fromages', 'roquefort', 'poivre', 'curry', 'basquaise', 'poivrons'];
const FRITES = ['frite', 'frites'];
const CHIPS = ['chips'];
const DESSERTS_PORTION = ['tiramisu', 'dessert', 'gateau', 'g\u00e2teau', 'mousse', 'creme dessert', 'cr\u00e8me dessert', 'profiterole', 'baba au rhum'];
const SODAS = ['cola', 'coca', 'coca-cola', 'soda', 'limonade'];
const BIERES = ['biere', 'bi\u00e8re', 'beer', 'cerveza', 'panache', 'panach\u00e9'];
const VINS = ['vin', 'verre de vin'];
const ALCOOLS_FORTS = ['rhum', 'vodka', 'whisky', 'cognac', 'armagnac', 'eau de vie', 'gin', 'tequila', 'pastis'];
const LAITS = ['lait', 'verre de lait'];
const PAINS = ['pain', 'pain complet', 'pain integral', 'pain int\u00e9gral', 'pain de mie', 'tartine', 'baguette'];
const PATES_A_TARTINER = ['nutella', 'pate a tartiner', 'p\u00e2te a tartiner', 'pate \u00e0 tartiner', 'p\u00e2te \u00e0 tartiner', 'chocolat noisette'];
const BEURRES_CACAHUETE = ['beurre de cacahuete', 'beurre de cacahu\u00e8te', 'peanut butter'];
const FROMAGES_SPECIFIQUES = ['fromage blanc', 'emmental', 'emmenthal', 'camembert', 'parmesan', 'roquefort', 'brie', 'cheddar', 'gouda', 'mozzarella', 'chevre', 'ch\u00e8vre', 'comte', 'comt\u00e9'];

function estOeuf(nom) {
  const n = normaliserNom(nom);
  if (n.includes('boeuf')) return false;
  return n.includes('oeuf') || n.includes('oeufs');
}

function estViande(nom) {
  const n = normaliserNom(nom);
  return VIANDES.some(v => n.includes(normaliserNom(v)));
}

function estPoisson(nom) {
  const n = normaliserNom(nom);
  return POISSONS.some(v => n.includes(normaliserNom(v)));
}

function estFeculent(nom) {
  const n = normaliserNom(nom);
  return FECULENTS.some(v => n.includes(normaliserNom(v)));
}

function estBoisson(nom) {
  if (estSoda(nom) || estBiere(nom) || estVin(nom) || estAlcoolFort(nom)) return true;
  const n = normaliserNom(nom);
  const mots = motsSignificatifs(nom);
  return BOISSONS.some((v) => {
    const nv = normaliserNom(v);
    if (nv === 'vin' || nv === 'rhum' || nv === 'vodka' || nv === 'whisky' || nv === 'cognac' || nv === 'armagnac') return false;
    if (nv.includes(' ')) return n.includes(nv);
    return mots.includes(nv);
  });
}

function estLegume(nom) {
  const n = normaliserNom(nom);
  return LEGUMES.some(v => n.includes(normaliserNom(v)));
}

function estPlatCompose(nom) {
  const n = normaliserNom(nom);
  return PLATS_COMPOSES.some(v => n.includes(normaliserNom(v)));
}

function estSaucePetite(nom) {
  const n = normaliserNom(nom);
  return SAUCES_PETITES.some(v => n.includes(normaliserNom(v)));
}

function estSauceStandard(nom) {
  const n = normaliserNom(nom);
  const mots = motsSignificatifs(nom);
  const estPlatPates = mots.some(m => ['pate', 'spaghetti', 'tagliatelle'].includes(m));
  if (estPlatPates) return false;

  return SAUCES_STANDARD.some((v) => {
    const nv = normaliserNom(v);
    return (n.includes('sauce') && n.includes(nv)) || (mots.length === 1 && mots[0] === nv);
  });
}

function getNomCiqualSauce(nom) {
  const n = normaliserNom(nom);
  if (n.includes('carbonara')) return 'sauce carbonara, faite maison (estimation)';
  if (n.includes('bolognaise')) return 'sauce bolognaise, faite maison (estimation)';
  return null;
}

function estFrites(nom) {
  const n = normaliserNom(nom);
  return FRITES.some(v => n.includes(normaliserNom(v)));
}

function estChips(nom) {
  const mots = motsSignificatifs(nom);
  return CHIPS.some(v => mots.includes(normaliserNom(v)));
}

function estDessertPortion(nom) {
  const n = normaliserNom(nom);
  return DESSERTS_PORTION.some(v => n.includes(normaliserNom(v)));
}

function estSoda(nom) {
  const mots = motsSignificatifs(nom);
  return SODAS.some(v => mots.includes(normaliserNom(v)));
}

function estBiere(nom) {
  const n = normaliserNom(nom);
  const mots = motsSignificatifs(nom);
  return BIERES.some((v) => {
    const nv = normaliserNom(v);
    return nv.includes(' ') ? n.includes(nv) : mots.includes(nv);
  });
}

function estVin(nom) {
  const n = normaliserNom(nom);
  const mots = motsSignificatifs(nom);
  return n.includes('verre de vin') || n.includes('verres de vin') || n.includes('vin rouge') || n.includes('vin blanc') || n.includes('vin rose') || n.includes('vin ros\u00e9') || (mots.includes('vin') && mots.includes('verre')) || mots.join(' ') === 'vin';
}

function estAlcoolFort(nom) {
  const n = normaliserNom(nom);
  if (n.includes('baba')) return false;
  return ALCOOLS_FORTS.some(v => n.includes(normaliserNom(v)));
}

function estLait(nom) {
  const n = normaliserNom(nom);
  const mots = motsSignificatifs(nom);
  if (n.includes('lait de coco') || mots.includes('laitue')) return false;
  return LAITS.some(v => n.includes(normaliserNom(v))) || mots.includes('lait');
}

function getNomCiqualLait(nom) {
  const n = normaliserNom(nom);
  if (n.includes('entier')) return 'lait entier, uht';
  if (n.includes('ecreme')) return 'lait \u00e9cr\u00e9m\u00e9, uht';
  return 'lait demi-\u00e9cr\u00e9m\u00e9, uht';
}

function estPain(nom) {
  const n = normaliserNom(nom);
  if (n.includes('pain au chocolat')) return false;
  return PAINS.some(v => n.includes(normaliserNom(v)));
}

function getNomCiqualPain(nom) {
  const n = normaliserNom(nom);
  if (n.includes('complet') || n.includes('integral')) return 'pain complet ou int\u00e9gral (\u00e0 la farine t150)';
  if (n.includes('baguette')) return 'pain, baguette, courante';
  return 'pain courant, 400g ou boule';
}

function getNomAffichagePain(nom) {
  const n = normaliserNom(nom);
  if (n.includes('complet') || n.includes('integral')) return 'pain complet';
  if (n.includes('baguette')) return 'baguette';
  return 'pain';
}

function estPateATartiner(nom) {
  const n = normaliserNom(nom);
  return PATES_A_TARTINER.some(v => n.includes(normaliserNom(v)));
}

function estBeurreCacahuete(nom) {
  const n = normaliserNom(nom);
  return BEURRES_CACAHUETE.some(v => n.includes(normaliserNom(v)));
}

function estBeurre(nom) {
  const n = normaliserNom(nom);
  const mots = motsSignificatifs(nom);
  if (estBeurreCacahuete(n) || n.includes('haricot beurre') || n.includes('beurre de cacao') || n.includes('beurre de karite')) return false;
  return mots.includes('beurre');
}

function estFromageGenerique(nom) {
  const n = normaliserNom(nom);
  const mots = motsSignificatifs(nom);
  if (!mots.includes('fromage')) return false;
  if (n.includes('sauce') || n.includes('pizza') || n.includes('pate') || n.includes('gratin')) return false;
  if (FROMAGES_SPECIFIQUES.some(v => n.includes(normaliserNom(v)))) return false;
  return mots.length === 1 || mots.includes('morceau') || mots.includes('portion') || mots.includes('tranche');
}

function appliquerDefautGrammes(a, grammesParUnite) {
  const quantite = Number(a.quantite) || 0;
  if (a.unite === 'piece' && quantite > 0) {
    a.quantite = quantite * grammesParUnite;
  } else if (quantiteAbsente(a.quantite)) {
    a.quantite = grammesParUnite;
  }
  a.unite = 'gramme';
}

function appliquerDefautVolume(a, mlParUnite) {
  const quantite = Number(a.quantite) || 0;
  if (a.unite === 'piece' && quantite > 0) {
    a.quantite = quantite * mlParUnite;
  } else if (quantiteAbsente(a.quantite)) {
    a.quantite = mlParUnite;
  }
  a.unite = 'ml';
}

function getPoidsPiece(nom) {
  const n = normaliserNom(nom);
  for (const [k, v] of Object.entries(poidsPiece)) {
    if (k === 'oeuf') {
      if (estOeuf(n)) return v;
      continue;
    }
    if (n.includes(normaliserNom(k))) return v;
  }
  return 100;
}

function quantiteAbsente(quantite) {
  return quantite === 0 || quantite === '0' || quantite === null || quantite === undefined || quantite === '';
}

function nombreOpenFoodFacts(valeur) {
  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? nombre : 0;
}

function premiereValeurNumerique(objet, cles) {
  for (const cle of cles) {
    const nombre = nombreOpenFoodFacts(objet?.[cle]);
    if (nombre > 0) return nombre;
  }
  return 0;
}

function estProduitLiquideOpenFoodFacts(produit) {
  const texte = normaliserNom([
    produit.product_name_fr,
    produit.product_name,
    produit.generic_name_fr,
    produit.generic_name,
    produit.brands,
    produit.categories,
    Array.isArray(produit.categories_tags) ? produit.categories_tags.join(' ') : produit.categories_tags,
    produit.quantity,
    produit.product_quantity_unit,
    produit.serving_quantity_unit,
    produit.serving_size,
  ].filter(Boolean).join(' '));

  const motsLiquides = [
    'boisson', 'drink', 'beverage',
    'eau', 'water',
    'jus', 'juice',
    'soda', 'cola', 'coca', 'limonade', 'limonada',
    'biere', 'beer', 'cerveza', 'maestra', 'lager', 'ale', 'stout',
    'vin', 'wine', 'cidre', 'cider',
    'lait', 'milk',
    'the', 'tea', 'cafe', 'coffee',
  ];

  const mots = motsSignificatifs(texte);
  return motsLiquides.some((mot) => {
    if (mot.length <= 4) return mots.includes(mot);
    return texte.includes(mot);
  });
}

function extrairePortionProduit(produit) {
  const textePortion = normaliserNom([produit.serving_size, produit.serving_quantity_unit].filter(Boolean).join(' '));
  const quantitePortion = nombreOpenFoodFacts(produit.serving_quantity);
  const estLiquide = estProduitLiquideOpenFoodFacts(produit);
  const unite = textePortion.includes('ml') || textePortion.includes('cl') || textePortion.match(/\b[0-9]+([.,][0-9]+)?\s*l\b/) || (estLiquide && !textePortion.includes('g')) ? 'ml' : 'gramme';

  if (quantitePortion > 0) {
    if (textePortion.includes('cl') && !textePortion.includes('ml')) return { quantite: quantitePortion * 10, unite: 'ml' };
    if (textePortion.match(/\b[0-9]+([.,][0-9]+)?\s*l\b/)) return { quantite: quantitePortion * 1000, unite: 'ml' };
    return { quantite: quantitePortion, unite };
  }

  const match = textePortion.match(/([0-9]+(?:[.,][0-9]+)?)\s*(ml|cl|l|g)/);
  if (match) {
    const valeur = Number(match[1].replace(',', '.'));
    if (match[2] === 'ml') return { quantite: valeur, unite: 'ml' };
    if (match[2] === 'cl') return { quantite: valeur * 10, unite: 'ml' };
    if (match[2] === 'l') return { quantite: valeur * 1000, unite: 'ml' };
    return { quantite: valeur, unite: 'gramme' };
  }

  return { quantite: 100, unite: estLiquide ? 'ml' : 'gramme' };
}

function transformerProduitOpenFoodFacts(produit, codeBarres) {
  const nutriments = produit.nutriments || {};
  const nomProduit = produit.product_name_fr || produit.product_name || produit.generic_name_fr || produit.generic_name || ('Produit scanne ' + codeBarres);
  const marque = produit.brands ? String(produit.brands).split(',')[0].trim() : '';
  const { quantite, unite } = extrairePortionProduit(produit);
  const facteur = quantite / 100;
  const calories100g = premiereValeurNumerique(nutriments, ['energy-kcal_100g', 'energy-kcal_value', 'energy-kcal']);
  const caloriesDepuisKj = calories100g > 0 ? calories100g : nombreOpenFoodFacts(nutriments['energy_100g']) / 4.184;
  const proteines100 = nombreOpenFoodFacts(nutriments.proteins_100g);
  const glucides100 = nombreOpenFoodFacts(nutriments.carbohydrates_100g);
  const lipides100 = nombreOpenFoodFacts(nutriments.fat_100g);
  const sucres100 = nombreOpenFoodFacts(nutriments.sugars_100g);
  const fibres100 = nombreOpenFoodFacts(nutriments.fiber_100g);

  return {
    nom: quantite + ' ' + (unite === 'ml' ? 'ml ' : 'g ') + (marque ? nomProduit + ' - ' + marque : nomProduit),
    calories: Math.round(caloriesDepuisKj * facteur),
    proteines: Math.round(proteines100 * facteur * 10) / 10,
    glucides: Math.round(glucides100 * facteur * 10) / 10,
    lipides: Math.round(lipides100 * facteur * 10) / 10,
    sucres: Math.round(sucres100 * facteur * 10) / 10,
    fibres: Math.round(fibres100 * facteur * 10) / 10,
    _nom: marque ? nomProduit + ' - ' + marque : nomProduit,
    _quantite: String(Math.round(quantite * 10) / 10),
    _unite: unite,
    _calories100: Math.round(caloriesDepuisKj * 10) / 10,
    _proteines100: proteines100,
    _glucides100: glucides100,
    _lipides100: lipides100,
    _sucres100: sucres100,
    _fibres100: fibres100,
    code_barres: codeBarres,
    source: 'Open Food Facts',
    image: produit.image_front_url || null,
  };
}

function motsSignificatifs(texte) {
  return normaliserNom(texte)
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(m => m.length > 2)
    .map(m => (m.endsWith('s') && m.length > 4 ? m.slice(0, -1) : m));
}

function estAlimentPiece(nom) {
  const n = normaliserNom(nom);
  if (estOeuf(n)) return true;

  const unitesDeMesure = ['verre', 'tasse', 'cuillere', 'portion', 'tranche'];
  if (estBoisson(n) && !unitesDeMesure.some(u => n.includes(u))) return false;

  return Object.keys(poidsPiece).some((k) => {
    if (k === 'oeuf') return false;
    return n.includes(normaliserNom(k));
  });
}

function rechercherCiqual(nomFr) {
  const nom = normaliserNom(nomFr).trim();
  const mots = motsSignificatifs(nomFr);
  let meilleur = null;
  let meilleurScore = 0;
  for (const a of alimentsRecherche) {
    if (a.calories <= 0) continue;
    const n = normaliserNom(a.nom);
    if (n === nom) return a;
    let score = 0;
    if (n.startsWith(nom)) score = 100;
    else if (n.includes(nom) && nom.length >= 4) score = 80;
    else if (nom.includes(n) && n.length >= 4) score = 70;
    else {
      const motsN = motsSignificatifs(a.nom);
      const communs = mots.filter(m => motsN.some(mn => mn === m));
      score = communs.length / Math.max(mots.length, 1) * 100;
    }
    if (score > meilleurScore) { meilleurScore = score; meilleur = a; }
  }
  return meilleurScore >= 50 ? meilleur : null;
}

function decomposerPainTartine(a) {
  const nomOriginal = a.nom_original || '';
  const nom = normaliserNom(nomOriginal);
  const estBasePain = nom.includes('tartine') || nom.includes('pain');

  if (!estBasePain) return [a];

  const resultats = [];
  const nomPain = nom.includes('complet') || nom.includes('integral') ? 'pain complet' : 'pain';
  const pain = {
    nom_ciqual: getNomCiqualPain(nomOriginal),
    nom_original: nomPain,
    quantite: 50,
    unite: 'gramme',
  };

  if (estPateATartiner(nom)) {
    resultats.push(pain, {
      nom_ciqual: 'pate a tartiner chocolat noisette',
      nom_original: 'Nutella',
      quantite: 20,
      unite: 'gramme',
    });
    return resultats;
  }

  if (estBeurreCacahuete(nom)) {
    resultats.push(pain, {
      nom_ciqual: 'beurre de cacahuete',
      nom_original: 'beurre de cacahuete',
      quantite: 20,
      unite: 'gramme',
    });
    return resultats;
  }

  if (estBeurre(nom)) {
    resultats.push(pain, {
      nom_ciqual: 'beurre doux',
      nom_original: 'beurre',
      quantite: 10,
      unite: 'gramme',
    });
    return resultats;
  }

  return [a];
}

function appliquerDefauts(a) {
  if (a.nom_original) {
    a.nom_original = String(a.nom_original)
      .trim()
      .replace(/^(de|du|des)\s+/i, '')
      .replace(/^d['’]\s*/i, '');
  }

  const nom = normaliserNom(a.nom_original);

  // Boissons avec portion standard.
  if (estSoda(nom)) {
    if (nom.includes('zero') || nom.includes('light') || nom.includes('sans sucre')) {
      a.nom_ciqual = 'cola, non sucr\u00e9, avec \u00e9dulcorants';
    } else {
      a.nom_ciqual = 'cola, sucr\u00e9';
    }
    appliquerDefautVolume(a, 330);
    return a;
  }

  if (estBiere(nom)) {
    a.nom_ciqual = nom.includes('panache') ? 'panach\u00e9 (limonade et bi\u00e8re)' : 'bi\u00e8re blanche';
    a.nom_original = nom.includes('panache') ? 'panach\u00e9' : 'bi\u00e8re';
    appliquerDefautVolume(a, 330);
    return a;
  }

  if (estLait(nom)) {
    a.nom_ciqual = getNomCiqualLait(nom);
    a.nom_original = 'lait';
    appliquerDefautVolume(a, 150);
    return a;
  }

  // Frites : portion moyenne.
  if (estFrites(nom)) {
    a.nom_ciqual = 'frites de pommes de terre, surgel\u00e9es, cuites en friteuse';
    const quantite = Number(a.quantite) || 0;
    if (a.unite === 'piece' && quantite > 0) a.quantite = quantite * 150;
    else if (quantiteAbsente(a.quantite)) a.quantite = 150;
    a.unite = 'gramme';
    return a;
  }

  if (estChips(nom)) {
    a.nom_ciqual = 'chips de pommes de terre nature ou aromatis\u00e9es, standard';
    appliquerDefautGrammes(a, 30);
    return a;
  }

  // Desserts individuels : portion moyenne de 100g.
  if (estDessertPortion(nom)) {
    const quantite = Number(a.quantite) || 0;
    if (a.unite === 'piece' && quantite > 0) a.quantite = quantite * 100;
    else if (quantiteAbsente(a.quantite)) a.quantite = 100;
    a.unite = 'gramme';
    if (nom.includes('tiramisu')) a.nom_ciqual = 'tiramisu, pr\u00e9emball\u00e9';
    return a;
  }

  if (estAlcoolFort(nom)) {
    appliquerDefautVolume(a, 50);
    return a;
  }

  if (estVin(nom)) {
    appliquerDefautVolume(a, 150);
    return a;
  }

  // Tartines, pain et produits a tartiner.
  if (estPateATartiner(nom)) {
    a.nom_ciqual = 'pate a tartiner chocolat noisette';
    appliquerDefautGrammes(a, 20);
    return a;
  }

  if (estBeurreCacahuete(nom)) {
    a.nom_ciqual = 'beurre de cacahuete';
    appliquerDefautGrammes(a, 20);
    return a;
  }

  if (estBeurre(nom)) {
    a.nom_ciqual = 'beurre doux';
    appliquerDefautGrammes(a, 10);
    return a;
  }

  if (estPain(nom)) {
    a.nom_ciqual = getNomCiqualPain(nom);
    a.nom_original = getNomAffichagePain(nom);
    appliquerDefautGrammes(a, 50);
    return a;
  }

  // Fromage seul : portion standard de 30g, pas fromage blanc.
  if (estFromageGenerique(nom)) {
    a.nom_ciqual = 'emmental ou emmenthal';
    appliquerDefautGrammes(a, 30);
    return a;
  }

  // Aliments a l'unite sans nombre -> 1 piece.
  if (estAlimentPiece(nom)) {
    a.unite = 'piece';
    if (quantiteAbsente(a.quantite)) a.quantite = 1;
    if (estOeuf(nom) && !nom.includes('plat') && !nom.includes('dur') && !nom.includes('coque') && !nom.includes('poche')) {
      a.nom_ciqual = 'oeuf, brouill\u00e9, avec mati\u00e8re grasse';
    }
    return a;
  }

  // Sauces : portion par defaut selon densite calorique.
  if (estSaucePetite(nom)) {
    a.unite = 'gramme';
    if (quantiteAbsente(a.quantite)) a.quantite = 30;
  } else if (estSauceStandard(nom)) {
    const nomSauce = getNomCiqualSauce(nom);
    if (nomSauce) a.nom_ciqual = nomSauce;
    a.unite = 'gramme';
    if (quantiteAbsente(a.quantite)) a.quantite = 80;
  }

  // Plats composes : portion repas moyenne.
  if (estPlatCompose(nom)) {
    a.unite = 'gramme';
    if (quantiteAbsente(a.quantite)) a.quantite = 300;
  }

  // Steak -> steak hache par defaut
  if (nom.includes('steak') || nom.includes('bifteck')) {
    if (!nom.includes('faux') && !nom.includes('rumsteck')) {
      a.nom_ciqual = 'boeuf, steak hach\u00e9, cuit (aliment moyen)';
    }
  }

  // Viandes : 180g si pas de poids precise (quantite=0)
  if (estViande(nom) && !estOeuf(nom)) {
    a.unite = 'gramme';
    if (quantiteAbsente(a.quantite)) a.quantite = 180;
  }

  // Poissons : 180g si pas de poids precise
  if (estPoisson(nom)) {
    a.unite = 'gramme';
    if (quantiteAbsente(a.quantite)) a.quantite = 180;
  }

  // Feculents : 180g si pas de poids precise
  if (estFeculent(nom) && !estViande(nom)) {
    a.unite = 'gramme';
    if (quantiteAbsente(a.quantite)) a.quantite = 180;
  }

  // Legumes : portion moyenne plus petite que les feculents.
  if (estLegume(nom) && !estFeculent(nom) && !estViande(nom) && !estPoisson(nom)) {
    a.unite = 'gramme';
    if (quantiteAbsente(a.quantite)) a.quantite = 150;
  }

  // Boissons : 150ml si pas de quantite precise
  if (estBoisson(nom)) {
    a.unite = 'ml';
    if (quantiteAbsente(a.quantite)) a.quantite = 150;
  }

  return a;
}

app.post('/nutrition', async (req, res) => {
  const { aliment } = req.body;
  try {
    const prompt = "Tu es un expert en nutrition. Analyse ce repas et reponds UNIQUEMENT avec un tableau JSON valide sans backticks ni explication.\n\nREGLES TRES IMPORTANTES:\n1) Convertis les nombres en toutes lettres en chiffres: trois=3, deux=2, un=1, une=1, quatre=4, cinq=5.\n2) La quantite est toujours UN SEUL NOMBRE. Le nom_original ne doit JAMAIS contenir de nombre.\n3) Les oeufs, fruits entiers et aliments a l unite se comptent TOUJOURS en pieces (unite=piece). Exemple : '2 oeufs' = quantite=2, unite=piece. Si aucun nombre n est precise pour un aliment a l unite, mets quantite=0.\n4) Pour les sauces sans quantite precisee, mets unite=gramme et quantite=0. Le serveur appliquera la portion par defaut.\n5) Si l utilisateur dit pates carbonara ou pates bolognaise, separe TOUJOURS en deux aliments: pates + carbonara/bolognaise.\n6) Si l utilisateur dit tartine de beurre, tartine de Nutella, pain beurre, pain complet beurre de cacahuete, separe TOUJOURS le pain/tartine et la garniture.\n7) Nutella, pate a tartiner et pate a tartiner chocolat noisette veulent dire le meme aliment.\n8) Si l utilisateur precise un poids en grammes (ex: 200g, 300g), mets unite=gramme et quantite=ce poids exact.\n9) Si l utilisateur ne precise PAS de poids, mets unite=gramme et quantite=0.\n10) Si l utilisateur precise un volume en ml (ex: 250ml), mets unite=ml et quantite=ce volume exact.\n11) Si l utilisateur ne precise PAS de volume pour une boisson, mets unite=ml et quantite=0.\n12) Choisis le nom EXACT dans cette liste Ciqual officielle:\n" + listePourClaude + "\n\nSi l aliment n est pas dans la liste, mets null pour nom_ciqual.\n\nFormat JSON strict:\n[{\"nom_ciqual\":\"boeuf, steak hache, cuit (aliment moyen)\",\"nom_original\":\"steak\",\"quantite\":0,\"unite\":\"gramme\"}]\n\nRepas a analyser: " + aliment;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const claudeData = await claudeResponse.json();
    const texte = claudeData.content[0].text.trim().replace(/```json/g, '').replace(/```/g, '').trim();
    const alimentsExtraits = JSON.parse(texte).flatMap(decomposerPainTartine);

    const resultats = alimentsExtraits.map((a) => {
      a = appliquerDefauts(a);

      let found = null;
      if (a.nom_ciqual && a.nom_ciqual !== 'null') {
        found = indexCourants[a.nom_ciqual] || indexCiqual[a.nom_ciqual];
      }
      if (!found && a.nom_original) {
        found = rechercherCiqual(a.nom_original);
      }

      const nomLower = normaliserNom(a.nom_original);
      const forcePiece = estAlimentPiece(nomLower) && a.unite !== 'gramme' && a.unite !== 'ml';
      if (forcePiece) {
        a.unite = 'piece';
        if (quantiteAbsente(a.quantite)) a.quantite = 1;
      }

      let quantiteG;
      const quantite = Number(a.quantite) || 0;
      if (a.unite === 'piece') quantiteG = quantite * getPoidsPiece(a.nom_original || '');
      else if (a.unite === 'ml') quantiteG = quantite;
      else quantiteG = quantite;
      const facteur = quantiteG / 100;

      if (found) {
        return {
          nom: a.quantite + ' ' + (a.unite === 'piece' ? 'x ' : (a.unite === 'ml' ? 'ml ' : 'g ')) + (a.nom_original || found.nom),
          calories: Math.round(found.calories * facteur),
          proteines: Math.round(found.proteines * facteur * 10) / 10,
          glucides: Math.round(found.glucides * facteur * 10) / 10,
          lipides: Math.round(found.lipides * facteur * 10) / 10,
          sucres: Math.round(found.sucres * facteur * 10) / 10,
          fibres: Math.round(found.fibres * facteur * 10) / 10,
        };
      }
      return {
        nom: a.quantite + ' ' + (a.nom_original || a.nom_ciqual || ''),
        calories: 0, proteines: 0, glucides: 0, lipides: 0, sucres: 0, fibres: 0,
      };
    });
    res.json(resultats);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/barcode/:code', async (req, res) => {
  const codeBarres = String(req.params.code || '').replace(/[^0-9]/g, '');

  if (!codeBarres) {
    return res.status(400).json({ error: 'Code-barres invalide' });
  }

  try {
    const url = 'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(codeBarres) + '.json?fields=code,status,product_name,product_name_fr,generic_name,generic_name_fr,brands,categories,categories_tags,quantity,product_quantity,product_quantity_unit,serving_size,serving_quantity,serving_quantity_unit,nutriments,image_front_url';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CalorieApp/1.0 (contact: arnaudleonesquevin-hash)',
      },
    });
    const data = await response.json();

    if (!response.ok || data.status !== 1 || !data.product) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }

    const produit = transformerProduitOpenFoodFacts(data.product, codeBarres);
    res.json(produit);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Serveur Ciqual v12 demarre!');
});
