require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(helmet());

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
});

app.use(limiter);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
}); 

app.get('/', (req, res) => {
    res.send('Server is running.');
});

app.post('/send-mail', async (req, res) => {
    const { to, subject, message } = req.body;

    try {
        // Load the HTML template
        const templatePath = path.join(__dirname, 'email-template.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        // Replace placeholders with dynamic content
        htmlContent = htmlContent.replace('{{subject}}', subject).replace('{{message}}', message);

        // Send the email
        await transporter.sendMail({
            from: `Coinbase <${process.env.SMTP_FROM}>`,
            to,
            subject,
            html: htmlContent,
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email.' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
