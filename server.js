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
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Donne-moi les informations nutritionnelles pour: ${aliment}. Réponds UNIQUEMENT avec ce format JSON sans aucun autre texte: {"calories": 000, "proteines": 00, "glucides": 00, "lipides": 00}`
        }]
      })
    });const data = await response.json();
    const texte = data.content[0].text;
    const nutrition = JSON.parse(texte);
    res.json(nutrition);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Serveur démarré sur le port 3000');
});