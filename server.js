const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const ciqual = JSON.parse(fs.readFileSync('./ciqual.json', 'utf8'));

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
      const mots = nom.split(' ');
      const motsN = n.split(' ');
      const communs = mots.filter(m => m.length > 2 && motsN.some(mn => mn.includes(m) || m.includes(mn)));
      score = communs.length / Math.max(mots.length, motsN.length) * 60;
    }
    if (score > meilleurScore) { meilleurScore = score; meilleur = a; }
  }
  return meilleurScore > 20 ? meilleur : null;
}

const poidsPiece = {
  'oeuf': 50, 'orange': 150, 'pomme': 150, 'banane': 120,
  'kiwi': 80, 'poire': 150, 'peche': 150, 'hamburger': 180,
  'biscuit': 15, 'tranche': 30, 'yaourt': 125, 'verre': 200,
  'tasse': 250, 'cuillere': 15
};

function getPoidsPiece(nom) {
  const n = nom.toLowerCase();
  for (const [k, v] of Object.entries(poidsPiece)) {
    if (n.includes(k)) return v;
  }
  return 100;
}

app.post('/nutrition', async (req, res) => {
  const { aliment } = req.body;
  try {
    const prompt = 'Analyse ce repas. Reponds UNIQUEMENT avec un tableau JSON valide sans backticks. Extrais chaque aliment avec son nom en francais et sa quantite. Format: [{"nom":"oeuf","quantite":2,"unite":"piece"},{"nom":"steak","quantite":200,"unite":"gramme"},{"nom":"lait","quantite":250,"unite":"ml"}]. Repas: ' + aliment;
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const claudeData = await claudeResponse.json();
    const texte = claudeData.content[0].text.trim().replace(/```json/g, '').replace(/```/g, '').trim();
    const alimentsExtraits = JSON.parse(texte);

    const resultats = alimentsExtraits.map((a) => {
      const found = rechercherCiqual(a.nom);
      let quantiteG;
      if (a.unite === 'piece') quantiteG = a.quantite * getPoidsPiece(a.nom);
      else if (a.unite === 'ml') quantiteG = a.quantite;
      else quantiteG = a.quantite;
      const facteur = quantiteG / 100;
      if (found) {
        return {
          nom: a.quantite + ' ' + (a.unite === 'piece' ? 'x ' : (a.unite === 'ml' ? 'ml ' : 'g ')) + found.nom,
          calories: Math.round(found.calories * facteur),
          proteines: Math.round(found.proteines * facteur * 10) / 10,
          glucides: Math.round(found.glucides * facteur * 10) / 10,
          lipides: Math.round(found.lipides * facteur * 10) / 10,
          sucres: Math.round(found.sucres * facteur * 10) / 10,
          fibres: Math.round(found.fibres * facteur * 10) / 10,
        };
      }
      return {
        nom: a.quantite + ' ' + a.nom,
        calories: 0, proteines: 0, glucides: 0, lipides: 0, sucres: 0, fibres: 0,
      };
    });
    res.json(resultats);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Serveur Ciqual demarre!');
});