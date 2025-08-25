import express from 'express';
import { save_offers_to_DB } from '../db.js';

export default function(db) {
    const router = express.Router();
    /*router.get('/offers', (req, res) => {
        db.all(`SELECT * FROM offers ORDER BY id ASC`, (err, rows) => {
            if (err) {
                console.error('Error querying offers:', err.message);
                res.status(500).json({ error: 'Failed to retrieve offers', message: err.message });
                return;
            }
            res.json(rows);  // Sends data from the 'offers' table
        });
    });

    // Save offer data via scrape
    router.get('/offers/save', async (req, res) => {
        try {
            await save_offers_to_DB('foetex');
            res.json({ message: 'Offers scraped and saved successfully!' });
        } catch (err) {
            console.error('Error saving offers:', err.message);
            res.status(500).json({ error: 'Failed to save offers', message: err.message });
        }
    });*/

    // Scrape and return offers
    router.get('/offers', async (req, res) => {
        try {
            await save_offers_to_DB('foetex');

            // Get the entered offers
            db.all(`SELECT * FROM offers ORDER BY id ASC`, (err, rows) => {
                if (err) {
                    console.error('Error querying offers after save:', err.message);
                    res.status(500).json({ error: 'Failed to retrieve offers', message: err.message });
                    return;
                }
                res.json(rows); // Return data
            });

        } catch (err) {
            console.error('Error saving offers:', err.message);
            res.status(500).json({ error: 'Failed to save offers', message: err.message });
        }
    });
    
    return router;
};