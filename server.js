const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/nutrition', async (req, res) => {
  const { aliment } = req.body;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: 'Tu es une base de donnees nutritionnelle. Analyse ce repas et reponds UNIQUEMENT avec un tableau JSON valide, sans backticks, sans explication. IMPORTANT: regroupe les aliments identiques en une seule entree avec la quantite totale. Ne cree jamais plusieurs lignes pour le meme aliment. Format: [{"nom":"3 hamburgers","calories":1620,"proteines":90,"glucides":120,"lipides":60}]. Repas: ' + aliment
        }]
      })
    });
    const data = await response.json();
    const texte = data.content[0].text.trim().replace(/```json/g, '').replace(/```/g, '').trim();
    const nutrition = JSON.parse(texte);
    res.json(nutrition);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Serveur demarre sur le port 3000');
});