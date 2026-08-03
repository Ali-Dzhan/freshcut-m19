const sqlite3 = require("sqlite3").verbose();
const path = require("path");

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
                customer_id INTEGER,
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

        db.all(`PRAGMA table_info(appointments)`, [], (tableErr, columns) => {
            if (tableErr) {
                console.error("Appointments migration failed:", tableErr.message);
                return;
            }

            const hasCustomerId = columns.some(column => column.name === "customer_id");

            if (!hasCustomerId) {
                db.run(`ALTER TABLE appointments ADD COLUMN customer_id INTEGER`);
            }
        });



        db.run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                password TEXT,
                auth_provider TEXT DEFAULT 'local',
                provider_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.all(`PRAGMA table_info(customers)`, [], (tableErr, columns) => {
            if (tableErr) {
                console.error("Customers migration failed:", tableErr.message);
                return;
            }

            const hasAuthProvider = columns.some(column => column.name === "auth_provider");
            const hasProviderId = columns.some(column => column.name === "provider_id");

            if (!hasAuthProvider) {
                db.run(`ALTER TABLE customers ADD COLUMN auth_provider TEXT DEFAULT 'local'`);
            }

            if (!hasProviderId) {
                db.run(`ALTER TABLE customers ADD COLUMN provider_id TEXT`);
            }
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS closed_dates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT UNIQUE NOT NULL,
                reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                duration TEXT,
                description TEXT,
                display_order INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

});


module.exports = db;
