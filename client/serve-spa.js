const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files with compression
app.use(compression());
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routes - redirect all requests to index.html
app.get('/*', function(req, res) {
  // Skip API calls 
  if (req.url.startsWith('/api')) {
    return res.sendStatus(404);
  }
  
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 