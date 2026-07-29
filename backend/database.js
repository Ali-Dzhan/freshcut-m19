const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "database", "freshcut.db");


const db = new sqlite3.Database(dbPath, (err) => {

    if (err) {

        console.error(
            "Database connection failed:",
            err.message
        );

    } else {

        console.log("Connected to SQLite database.");



        db.run(`
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT,
                service TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                note TEXT,
                status TEXT DEFAULT 'Pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);



        db.run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `);
    }

});


module.exports = db;