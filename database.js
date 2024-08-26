const sqlite3 = require('sqlite3').verbose();

// Use ':memory:' for an in-memory database, or use 'contact.db' for a file-based database
const db = new sqlite3.Database('contact.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY, name TEXT, email TEXT, message TEXT)", (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        }
    });
});

module.exports = db;
