const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const ciqual = JSON.parse(fs.readFileSync('./ciqual.json', 'utf8'));
const courants = JSON.parse(fs.readFileSync('./ciqual_courants.json', 'utf8'));
const indexCiqual = {};
for (const a of ciqual) indexCiqual[a.nom] = a;
const indexCourants = {};
for (const a of courants) indexCourants[a.nom] = a;

const listePourClaude = courants.map(a => a.nom).join('\n');

const poidsPiece = {
  'oeuf': 55, 'orange': 150, 'pomme': 150, 'banane': 120,
  'kiwi': 80, 'poire': 150, 'peche': 150, 'hamburger': 180,
  'biscuit': 15, 'tranche': 30, 'yaourt': 125, 'verre': 200,
  'tasse': 250, 'cuillere': 15, 'steak': 150, 'filet': 150,
  'cuisse': 200, 'escalope': 150, 'cote': 180, 'portion': 300
};

function getPoidsPiece(nom) {
  const n = nom.toLowerCase();
  for (const [k, v] of Object.entries(poidsPiece)) {
    if (n.includes(k)) return v;
  }
  return 100;
}

function rechercherCiqual(nomFr) {
  const nom = nomFr.toLowerCase().trim();
  let meilleur = null;
  let meilleurScore = 0;
  for (const a of ciqual) {
    if (a.calories <= 0) continue;
    const n = a.nom;
    if (n === nom) return a;
    let score = 0;
    if (n.includes(nom)) score = nom.length / n.length * 100;
    else if (nom.includes(n)) score = n.length / nom.length * 80;
    else {
      const mots = nom.split(' ').filter(m => m.length > 2);
      const motsN = n.split(' ');
      const communs = mots.filter(m => motsN.some(mn => mn.includes(m) || m.includes(mn)));
      score = communs.length / Math.max(mots.length, 1) * 60;
    }
    if (score > meilleurScore) { meilleurScore = score; meilleur = a; }
  }
  return meilleurScore > 20 ? meilleur : null;
}

app.post('/nutrition', async (req, res) => {
  const { aliment } = req.body;
  try {
    const prompt = 'Tu es un expert en nutrition. Analyse ce repas et reponds UNIQUEMENT avec un tableau JSON valide sans backticks ni explication. REGLES IMPORTANTES: 1) Les oeufs se comptent en pieces (unite=piece). 2) Les fruits entiers se comptent en pieces. 3) Les viandes et feculents avec un poids explicite utilisent unite=gramme. 4) Une portion ou un plat sans poids utilise unite=gramme avec quantite=300. 5) Choisis le nom EXACT dans cette liste Ciqual officielle: \n' + listePourClaude + '\n\nSi laliment nest pas dans la liste, mets null pour nom_ciqual. Format JSON strict: [{"nom_ciqual":"oeuf, brouille, avec matiere grasse","nom_original":"oeufs brouilles","quantite":3,"unite":"piece"},{"nom_ciqual":"boeuf, steak ou bifteck, grille","nom_original":"steak grille","quantite":150,"unite":"gramme"}]. Repas: ' + aliment;

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
      let found = null;
      if (a.nom_ciqual && a.nom_ciqual !== 'null') {
        found = indexCourants[a.nom_ciqual] || indexCiqual[a.nom_ciqual];
      }
      if (!found && a.nom_original) {
        found = rechercherCiqual(a.nom_original);
      }

      let quantiteG;
      if (a.unite === 'piece') quantiteG = a.quantite * getPoidsPiece(a.nom_original || '');
      else if (a.unite === 'ml') quantiteG = a.quantite;
      else quantiteG = a.quantite;
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
  console.log('Serveur Ciqual v4 demarre!');
});
