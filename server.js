const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Servuj pliki statyczne z tego folderu
app.use(express.static(__dirname));

// CORS headers dla Tampermonkey
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Private-Network', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Obsługa .user.js jako text/plain dla Tampermonkey
app.get('*.user.js', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, req.path));
});

app.listen(PORT, () => {
  console.log(`🐸 RzabiakPack server uruchomiony na http://localhost:${PORT}`);
});
