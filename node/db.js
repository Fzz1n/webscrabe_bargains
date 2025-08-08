import { scrape_offers } from './get_offer_notice.js';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Convert import.meta.url to __filename and __dirname equivalents
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'databases/offers.db');

async function save_offers_to_DB(shop){
    let offers;
    if(shop === 'foetex'){
        offers = await scrape_offers(`https://avis.foetex.dk/naeste-uges-avis/`);
    } else {
        console.error('Unknown shop:', shop);
        return;
    }

    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        }
    });
    
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS offers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                amount INTEGER,
                unit TEXT,
                unit_to_price TEXT,
                unit_price REAL,
                price REAL
            )
        `);

        db.run(`DELETE FROM offers`); // Delete existing rows

        const insert_stmt = db.prepare (`
            INSERT INTO offers (name, amount, unit, unit_to_price, unit_price, price)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        console.log('Antal tilbud fundet:', offers.name.length);

        for(let i = 0; i < offers.name.length; i++){
            if (offers.name[i] !== undefined) {
                insert_stmt.run([
                    offers.name[i],
                    offers.amount[i],
                    offers.unit[i],
                    offers.unit_to_price[i],
                    offers.unit_price[i],
                    offers.price[i]
                ]);
            }
        }

        insert_stmt.finalize(() => {
            db.close(); // Close the database only when all inserts are complete.
            console.log("Data saved and DB closed.");
        });
    });
}

//save_offers_to_DB('foetex');

export { save_offers_to_DB };
