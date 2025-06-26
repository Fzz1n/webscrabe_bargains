import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const port = 3000;

// Get the directory path of the current file (server.js)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files from the PublicResources folder
app.use(express.static(path.join(__dirname, 'PublicResources')));

// Route to serve the index.html from the html folder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'PublicResources', 'html', 'index.html'));
});

// Start the server on port = 3000
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
