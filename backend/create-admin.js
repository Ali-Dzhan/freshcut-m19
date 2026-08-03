const bcrypt = require("bcrypt");
const db = require("./database");

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
    console.error("Usage: npm run create-admin -- <username> <password>");
    process.exit(1);
}

if (password.length < 6) {
    console.error("Password must be at least 6 characters long.");
    process.exit(1);
}

async function createOrUpdateAdmin() {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                duration TEXT,
                description TEXT,
                display_order INTEGER
            )
        `);

        db.run(
        `
        INSERT INTO admins (username, password)
        VALUES (?, ?)
        ON CONFLICT(username) DO UPDATE SET password = excluded.password
        `,
        [username, hashedPassword],
        function (err) {
            if (err) {
                console.error("Admin setup failed:", err.message);
                process.exit(1);
            }

            console.log(`Admin "${username}" is ready.`);
            db.close();
        }
        );
    });
}

createOrUpdateAdmin().catch((err) => {
    console.error("Admin setup failed:", err.message);
    process.exit(1);
});
