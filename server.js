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
  const n = normaliserNom(nom);
  return BOISSONS.some(v => n.includes(normaliserNom(v)));
}

function estLegume(nom) {
  const n = normaliserNom(nom);
  return LEGUMES.some(v => n.includes(normaliserNom(v)));
}

function estPlatCompose(nom) {
  const n = normaliserNom(nom);
  return PLATS_COMPOSES.some(v => n.includes(normaliserNom(v)));
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
      const communs = mots.filter(m => motsN.some(mn => mn === m || mn.includes(m) || m.includes(mn)));
      score = communs.length / Math.max(mots.length, 1) * 100;
    }
    if (score > meilleurScore) { meilleurScore = score; meilleur = a; }
  }
  return meilleurScore >= 50 ? meilleur : null;
}

function appliquerDefauts(a) {
  const nom = normaliserNom(a.nom_original);

  // Aliments a l'unite sans nombre -> 1 piece.
  if (estAlimentPiece(nom)) {
    a.unite = 'piece';
    if (quantiteAbsente(a.quantite)) a.quantite = 1;
    if (estOeuf(nom) && !nom.includes('plat') && !nom.includes('dur') && !nom.includes('coque') && !nom.includes('poche')) {
      a.nom_ciqual = 'oeuf, brouill\u00e9, avec mati\u00e8re grasse';
    }
    return a;
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
    const prompt = "Tu es un expert en nutrition. Analyse ce repas et reponds UNIQUEMENT avec un tableau JSON valide sans backticks ni explication.\n\nREGLES TRES IMPORTANTES:\n1) Convertis les nombres en toutes lettres en chiffres: trois=3, deux=2, un=1, une=1, quatre=4, cinq=5.\n2) La quantite est toujours UN SEUL NOMBRE. Le nom_original ne doit JAMAIS contenir de nombre.\n3) Les oeufs, fruits entiers et aliments a l unite se comptent TOUJOURS en pieces (unite=piece). Exemple : '2 oeufs' = quantite=2, unite=piece. Si aucun nombre n est precise pour un aliment a l unite, mets quantite=0.\n4) Si l utilisateur precise un poids en grammes (ex: 200g, 300g), mets unite=gramme et quantite=ce poids exact.\n5) Si l utilisateur ne precise PAS de poids, mets unite=gramme et quantite=0.\n6) Si l utilisateur precise un volume en ml (ex: 250ml), mets unite=ml et quantite=ce volume exact.\n7) Si l utilisateur ne precise PAS de volume pour une boisson, mets unite=ml et quantite=0.\n8) Choisis le nom EXACT dans cette liste Ciqual officielle:\n" + listePourClaude + "\n\nSi l aliment n est pas dans la liste, mets null pour nom_ciqual.\n\nFormat JSON strict:\n[{\"nom_ciqual\":\"boeuf, steak hache, cuit (aliment moyen)\",\"nom_original\":\"steak\",\"quantite\":0,\"unite\":\"gramme\"}]\n\nRepas a analyser: " + aliment;

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
    const alimentsExtraits = JSON.parse(texte);

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
      const forcePiece = estAlimentPiece(nomLower);
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

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Serveur Ciqual v12 demarre!');
});
