const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function getCaloriesOpenFoodFacts(nom, quantite) {
  try {
    const url = 'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(nom) + '&json=true&page_size=1&fields=product_name,nutriments';
    const response = await fetch(url);
    const data = await response.json();
    if (data.products && data.products.length > 0) {
      const produit = data.products[0];
      const n = produit.nutriments;
      const facteur = quantite / 100;
      return {
        nom: nom + ' ' + quantite + 'g',
        calories: Math.round((n['energy-kcal_100g'] || 0) * facteur),
        proteines: Math.round((n['proteins_100g'] || 0) * facteur),
        glucides: Math.round((n['carbohydrates_100g'] || 0) * facteur),
        lipides: Math.round((n['fat_100g'] || 0) * facteur),
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

app.post('/nutrition', async (req, res) => {
  const { aliment } = req.body;
  try {
    const prompt = 'Analyse ce repas et reponds UNIQUEMENT avec un tableau JSON valide, sans backticks. Extrais chaque aliment avec sa quantite en grammes ou en nombre. Format: [{"nom":"oeuf","quantite":2,"unite":"piece"},{"nom":"steak","quantite":200,"unite":"gramme"}]. Repas: ' + aliment;
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

    const resultats = await Promise.all(alimentsExtraits.map(async (a) => {
      const quantiteEnGrammes = a.unite === 'piece' ? a.quantite * 60 : a.quantite;
      const offResult = await getCaloriesOpenFoodFacts(a.nom, quantiteEnGrammes);
      if (offResult) return offResult;
      return {
        nom: a.nom + ' ' + a.quantite + (a.unite === 'piece' ? ' piece(s)' : 'g'),
        calories: 0,
        proteines: 0,
        glucides: 0,
        lipides: 0,
      };
    }));

    res.json(resultats);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Serveur demarre sur le port 3000');
});