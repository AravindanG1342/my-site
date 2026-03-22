require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Serve website files from the parent directory (where bird-gallery.html lives)
app.use(express.static(path.join(__dirname, '..')));

// Route /api/:fn requests to the matching file in api/
app.all('/api/:fn', async (req, res) => {
  const fnPath = path.join(__dirname, 'api', `${req.params.fn}.js`);
  try {
    // Clear require cache so edits to api files are picked up without restart
    delete require.cache[require.resolve(fnPath)];
    const handler = require(fnPath);
    await handler(req, res);
  } catch (e) {
    console.error('API error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nServer running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/bird-gallery.html in your browser\n`);
});
