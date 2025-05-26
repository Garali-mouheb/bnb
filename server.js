// Import required modules
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Submission = require('./models/Submission');
const path = require('path');
require('dotenv').config();
const session = require('express-session');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// MongoDB Connection to Atlas
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Atlas connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

const User = mongoose.model('User', userSchema);

// Create an admin account if it doesn't exist
async function createAdminAccount() {
    const adminEmail = 'admin@bnbcenter.com';
    const adminPassword = await bcrypt.hash('admin123**', 10);
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
        const adminUser = new User({ email: adminEmail, password: adminPassword });
        await adminUser.save();
        console.log('Admin account created');
    }
}

createAdminAccount();

// Configure Nodemailer
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
    },
});

// Routes and API Endpoints
app.get('/', (req, res) => {
    res.send('Welcome to the Call Center API!');
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

app.get('/admin', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

app.post('/submit', async (req, res) => {
    try {
        const submissionData = new Submission(req.body);
        const savedSubmission = await submissionData.save();
        res.status(201).json({ 
            message: 'Form submitted successfully!',
            submission: savedSubmission 
        });
    } catch (error) {
        res.status(400).json({ error: 'Error submitting form: ' + error.message });
    }
});

app.get('/api/submissions', async (req, res) => {
    try {
        const submissions = await Submission.find().sort({ created_at: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching submissions' });
    }
});

app.put('/api/submissions/:id/read', async (req, res) => {
    try {
        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json(submission);
    } catch (error) {
        res.status(500).json({ error: 'Error updating submission' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        res.status(200).send('Login successful');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/admin/login.html');
    }
}

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.redirect('/admin/login.html');
    });
});

app.post('/api/export-submissions', async (req, res) => {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Invalid date range provided.' });
    }
    try {
        const submissions = await Submission.find({
            created_at: { $gte: new Date(startDate), $lte: new Date(endDate) }
        });
        if (!submissions.length) {
            return res.status(404).json({ error: 'No submissions found.' });
        }
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(submissions);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Submissions');
        const fileBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename=submissions.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(fileBuffer);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
