import express from 'express';
import { save_bargains_to_DB } from '../db.js';

export default function(db) {
    const router = express.Router();
    /*router.get('/bargains', (req, res) => {
        db.all(`SELECT * FROM bargains ORDER BY id ASC`, (err, rows) => {
            if (err) {
                console.error('Error querying bargains:', err.message);
                res.status(500).json({ error: 'Failed to retrieve bargains', message: err.message });
                return;
            }
            res.json(rows);  // Sends data from the 'bargains' table
        });
    });

    // Save bargain data via scrape
    router.get('/bargains/save', async (req, res) => {
        try {
            await save_bargains_to_DB('foetex');
            res.json({ message: 'bargains scraped and saved successfully!' });
        } catch (err) {
            console.error('Error saving bargains:', err.message);
            res.status(500).json({ error: 'Failed to save bargains', message: err.message });
        }
    });*/

    // Scrape and return bargains
    router.get('/bargains', async (req, res) => {
        try {
            await save_bargains_to_DB('foetex');

            // Get the entered bargains
            db.all(`SELECT * FROM bargains ORDER BY id ASC`, (err, rows) => {
                if (err) {
                    console.error('Error querying bargains after save:', err.message);
                    res.status(500).json({ error: 'Failed to retrieve bargains', message: err.message });
                    return;
                }
                res.json(rows); // Return data
            });

        } catch (err) {
            console.error('Error saving bargains:', err.message);
            res.status(500).json({ error: 'Failed to save bargains', message: err.message });
        }
    });
    
    return router;
};