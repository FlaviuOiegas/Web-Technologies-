const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./database'); // Import the database module
const { check, validationResult } = require('express-validator'); // Import express-validator
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// Configure session
app.use(session({
    secret: 'yourSecretKey', // Replace 'yourSecretKey' with a strong secret key
    resave: false,
    saveUninitialized: false
}));

// Hardcoded admin credentials (username: admin, password: admin123)
const adminUsername = 'admin';
const adminPasswordHash = bcrypt.hashSync('admin123', 10); // Hashing the password for security

// Middleware to protect admin routes
function checkAdminAuth(req, res, next) {
    if (req.session.isAdmin) {
        next(); // If admin is logged in, proceed
    } else {
        res.redirect('/admin/login'); // If not logged in, redirect to login page
    }
}

// Route definitions
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/areas', (req, res) => {
    res.render('areas/areas');
});

app.get('/faq', (req, res) => {
    db.all('SELECT * FROM faq', [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.render('faq', { faqs: rows });
    });
});

app.get('/offers', (req, res) => {
    res.render('offers');
});

app.get('/contact', (req, res) => {
    res.render('contact', { errors: [] }); // Pass an empty errors array by default
});

app.post('/contact', [
    check('name').trim().notEmpty().withMessage('Name is required').escape(),
    check('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    check('message').trim().notEmpty().withMessage('Message cannot be empty').escape()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('contact', { errors: errors.array() });
    }

    const { name, email, message } = req.body;
    db.run('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)', [name, email, message], function(err) {
        if (err) {
            return console.error(err.message);
        }
        res.redirect('/contact');
    });
});

// Area routes
app.get('/areas/quantum-zone', (req, res) => {
    res.render('areas/quantum-zone');
});

app.get('/areas/space-odyssey', (req, res) => {
    res.render('areas/space-odyssey');
});

app.get('/areas/cyber-city', (req, res) => {
    res.render('areas/cyber-city');
});

app.get('/areas/ai-world', (req, res) => {
    res.render('areas/ai-world');
});

app.get('/booking', (req, res) => {
    res.render('booking');
});

// Admin routes
app.get('/admin/login', (req, res) => {
    res.render('admin-login', { error: '' });
});

app.get('/admin/login', (req, res) => {
    res.render('admin-login', { error: '' }); // Pass an empty error string by default
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username === adminUsername && bcrypt.compareSync(password, adminPasswordHash)) {
        req.session.isAdmin = true;
        res.redirect('/admin/contacts');
    } else {
        res.render('admin-login', { error: 'Invalid credentials' }); // Pass the error message on failure
    }
});


app.get('/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/admin/contacts');
        }
        res.redirect('/admin/login');
    });
});

// Admin route to view contacts
app.get('/admin/contacts', checkAdminAuth, (req, res) => {
    db.all('SELECT * FROM contacts', [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.render('admin-contacts', { contacts: rows });
    });
});

// Admin route to manage FAQs
app.get('/admin/faqs', checkAdminAuth, (req, res) => {
    db.all('SELECT * FROM faq', [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.render('admin-faqs', { faqs: rows });
    });
});

app.post('/admin/faqs', checkAdminAuth, (req, res) => {
    const { question, answer } = req.body;
    db.run('INSERT INTO faq (question, answer) VALUES (?, ?)', [question, answer], function(err) {
        if (err) {
            return console.error(err.message);
        }
        res.redirect('/admin/faqs');
    });
});

app.post('/admin/faqs/delete/:id', checkAdminAuth, (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM faq WHERE id = ?', [id], function(err) {
        if (err) {
            return console.error(err.message);
        }
        res.redirect('/admin/faqs');
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

app.post('/booking', (req, res) => {
    const { name, email, guests, package } = req.body;

    db.run('INSERT INTO bookings (name, email, guests, package) VALUES (?, ?, ?, ?)',
        [name, email, guests, package],
        function(err) {
            if (err) {
                return console.error(err.message);
            }
            res.redirect('/booking/confirmation');
        }
    );
});
app.get('/booking/confirmation', (req, res) => {
    res.render('confirmation');
});
