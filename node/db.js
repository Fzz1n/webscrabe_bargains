import { scrape_bargains } from './get_bargains_notice.js';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Convert import.meta.url to __filename and __dirname equivalents
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'databases/bargains.db');

async function save_bargains_to_DB(shop){
    let bargains;
    if(shop === 'foetex'){
        bargains = await scrape_bargains(`https://avis.foetex.dk/naeste-uges-avis/`);
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
            CREATE TABLE IF NOT EXISTS bargains (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                amount INTEGER,
                unit TEXT,
                unit_to_price TEXT,
                unit_price REAL,
                price REAL
            )
        `);

        db.run(`DELETE FROM bargains`); // Delete existing rows
        db.run(`DELETE FROM sqlite_sequence WHERE name='bargains'`); // Reset ID 

        const insert_stmt = db.prepare (`
            INSERT INTO bargains (name, amount, unit, unit_to_price, unit_price, price)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        for(let i = 0; i < bargains.name.length; i++){
            if (bargains.name[i] !== undefined) {
                insert_stmt.run([
                    bargains.name[i],
                    bargains.amount[i],
                    bargains.unit[i],
                    bargains.unit_to_price[i],
                    bargains.unit_price[i],
                    bargains.price[i]
                ]);
            }
        }

        insert_stmt.finalize(() => {
            db.close(); // Close the database only when all inserts are complete.
            console.log("Data saved and DB closed.");
        });
    });
}

//save_bargains_to_DB('foetex');

export { save_bargains_to_DB };
