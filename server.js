const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const USDA_KEY = 'g86nKGFIderyO2b1RGniAqqfAmtcrVVVM641fO6I';

async function chercherUSDA(nomAnglais, quantite, unite) {
  try {
    const url = 'https://api.nal.usda.gov/fdc/v1/foods/search?query=' + encodeURIComponent(nomAnglais) + '&pageSize=1&api_key=' + USDA_KEY;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.foods || data.foods.length === 0) return null;
    const food = data.foods[0];
    const nutrients = food.foodNutrients;
    const get = (name) => {
      const n = nutrients.find(n => n.nutrientName && n.nutrientName.includes(name));
      return n ? n.value : 0;
    };
    const calories100g = get('Energy');
    const proteines100g = get('Protein');
    const glucides100g = get('Carbohydrate');
    const lipides100g = get('Total lipid');
    const fibres100g = get('Fiber');
    const sucres100g = get('Sugars');
    const facteur = unite === 'piece' ? (quantite * 60) / 100 : quantite / 100;
    return {
      nom: quantite + ' ' + (unite === 'piece' ? 'x ' : 'g ') + food.description,
      calories: Math.round(calories100g * facteur),
      proteines: Math.round(proteines100g * facteur * 10) / 10,
      glucides: Math.round(glucides100g * facteur * 10) / 10,
      sucres: Math.round(sucres100g * facteur * 10) / 10,
      lipides: Math.round(lipides100g * facteur * 10) / 10,
      fibres: Math.round(fibres100g * facteur * 10) / 10,
    };
  } catch (e) {
    return null;
  }
}

app.post('/nutrition', async (req, res) => {
  const { aliment } = req.body;
  try {
    const prompt = 'Analyse ce repas. Reponds UNIQUEMENT avec un tableau JSON valide sans backticks. Traduis chaque aliment en anglais. Format: [{"nom_anglais":"egg","quantite":2,"unite":"piece"},{"nom_anglais":"beef steak","quantite":200,"unite":"gramme"}]. Repas: ' + aliment;
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
      const result = await chercherUSDA(a.nom_anglais, a.quantite, a.unite);
      if (result) return result;
      return {
        nom: a.quantite + ' ' + a.nom_anglais,
        calories: 0,
        proteines: 0,
        glucides: 0,
        sucres: 0,
        lipides: 0,
        fibres: 0,
      };
    }));
    res.json(resultats);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Serveur demarre sur le port 3000');
});const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const USDA_KEY = 'TA_CLE_USDA';

async function chercherUSDA(nomAnglais, quantite, unite) {
  try {
    const url = 'https://api.nal.usda.gov/fdc/v1/foods/search?query=' + encodeURIComponent(nomAnglais) + '&pageSize=1&api_key=' + USDA_KEY;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.foods || data.foods.length === 0) return null;
    const food = data.foods[0];
    const nutrients = food.foodNutrients;
    const get = (name) => {
      const n = nutrients.find(n => n.nutrientName && n.nutrientName.includes(name));
      return n ? n.value : 0;
    };
    const calories100g = get('Energy');
    const proteines100g = get('Protein');
    const glucides100g = get('Carbohydrate');
    const lipides100g = get('Total lipid');
    const fibres100g = get('Fiber');
    const sucres100g = get('Sugars');
    const facteur = unite === 'piece' ? (quantite * 60) / 100 : quantite / 100;
    return {
      nom: quantite + ' ' + (unite === 'piece' ? 'x ' : 'g ') + food.description,
      calories: Math.round(calories100g * facteur),
      proteines: Math.round(proteines100g * facteur * 10) / 10,
      glucides: Math.round(glucides100g * facteur * 10) / 10,
      sucres: Math.round(sucres100g * facteur * 10) / 10,
      lipides: Math.round(lipides100g * facteur * 10) / 10,
      fibres: Math.round(fibres100g * facteur * 10) / 10,
    };
  } catch (e) {
    return null;
  }
}

app.post('/nutrition', async (req, res) => {
  const { aliment } = req.body;
  try {
    const prompt = 'Analyse ce repas. Reponds UNIQUEMENT avec un tableau JSON valide sans backticks. Traduis chaque aliment en anglais. Format: [{"nom_anglais":"egg","quantite":2,"unite":"piece"},{"nom_anglais":"beef steak","quantite":200,"unite":"gramme"}]. Repas: ' + aliment;
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
      const result = await chercherUSDA(a.nom_anglais, a.quantite, a.unite);
      if (result) return result;
      return {
        nom: a.quantite + ' ' + a.nom_anglais,
        calories: 0,
        proteines: 0,
        glucides: 0,
        sucres: 0,
        lipides: 0,
        fibres: 0,
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