// Import required modules
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Submission = require('./models/Submission');
const path = require('path'); // Import path module
require('dotenv').config(); // Load environment variables from .env file
const session = require('express-session');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000; // Allow PORT to be set via environment variables

// Enable CORS for all origins
app.use(cors());

// Middleware for parsing JSON bodies
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session({
    secret: 'your_secret_key', // Replace with a secure key
    resave: false,
    saveUninitialized: true,
}));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve static files from the dashboard directory
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

// Serve static files from the admin directory
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

// Admin dashboard route
app.get('/admin', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// MongoDB Connection
const mongoURI = "mongodb://localhost:27017/call_center_db";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully'))
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

// Configure Nodemailer to use your email service (e.g., Gmail)
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your email from .env file
        // pass: process.env.EMAIL_PASS,   // Your password from .env file
    },
});

// Endpoint to send email
app.post('/api/send-email', (req, res) => {
    const { username, email, subject, message } = req.body;

    const mailOptions = {
        from: email, // The sender's email
        to: process.env.EMAIL_USER, // The email address to receive messages (same as sender)
        subject: subject,
        text: `From: ${username} <${email}>\n\nMessage: ${message}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ success: false, message: 'Failed to send email' });
        }
        res.json({ success: true, message: 'Email sent successfully' });
    });
});

// Form submission endpoint
app.post('/submit', async (req, res) => {
    try {
        console.log('Received form submission:', req.body); // Add logging
        const submissionData = new Submission(req.body);
        const savedSubmission = await submissionData.save();
        console.log('Saved submission:', savedSubmission); // Add logging
        res.status(201).json({ 
            message: 'Form submitted successfully!',
            submission: savedSubmission 
        });
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(400).json({ 
            error: 'Error submitting form: ' + error.message,
            details: error 
        });
    }
});

// Old design route
app.get('/link', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// API route to get all submissions
app.get('/api/submissions', async (req, res) => {
    try {
        const submissions = await Submission.find().sort({ created_at: -1 });
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Error fetching submissions' });
    }
});

// API route to mark a submission as read
app.put('/api/submissions/:id/read', async (req, res) => {
    try {
        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json(submission);
    } catch (error) {
        console.error('Error updating submission:', error);
        res.status(500).json({ error: 'Error updating submission' });
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id; // Store user ID in session
        res.status(200).send('Login successful');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Middleware to protect routes
function isAuthenticated(req, res, next) {
    console.log('Session:', req.session); // Log session info
    if (req.session.userId) {
        next();
    } else {
        console.log('Redirecting to login, not authenticated');
        res.redirect('/admin/login.html');
    }
}

// Logout route
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).send('Could not log out.');
        }
        console.log('User logged out successfully');
        res.redirect('/admin/login.html');
    });
});

// Route for the root URL
app.get('/', (req, res) => {
    res.send('Welcome to the Call Center API!');
});

// Endpoint to export submissions to an Excel file
app.post('/api/export-submissions', async (req, res) => {
    const { startDate, endDate } = req.body; // Get start and end dates

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Invalid date range provided.' });
    }

    try {
        // Fetch submissions based on the date range
        const submissions = await Submission.find({
            created_at: { $gte: new Date(startDate), $lte: new Date(endDate) }
        });

        if (!submissions || submissions.length === 0) {
            return res.status(404).json({ error: 'No submissions found for the selected date range.' });
        }

        // Create a new workbook and add a worksheet
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(submissions);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Submissions');

        // Generate a buffer and send it as a downloadable file
        const fileBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename=submissions.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(fileBuffer);
    } catch (error) {
        console.error('Error exporting submissions:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

