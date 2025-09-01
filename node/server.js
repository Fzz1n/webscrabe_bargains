import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import routes from './routes/bargains.js';  // Import the routes

const app = express();
const PORT = 3000;

// Get the directory path of the current file (server.js)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files from the public_resources folder
app.use(express.static(path.join(__dirname, 'public_resources')));

// Remove access for the /databases directory
app.use('/databases', (req, res) => {
    res.status(403).send('Access Forbidden');
});

// Connecting to SQLite database
const dbPath = path.join(__dirname, 'databases/bargains.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Route to serve the index.html from the html folder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public_resources', 'html', 'home.html'));
});

// Use routes from routes.js for any additional routes
app.use('/api', routes(db)); // Pass db object if needed for other routes

// Handle undefined routes (404)
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start the server on the defined port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
