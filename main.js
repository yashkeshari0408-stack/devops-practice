const express = require('express')
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8000;

const DATA_FILE = '/app/data/message.txt';

const LOG_FILE = '/app/logs/app.log';

let isHealthy = true;


app.get("/write", (req, res) => {
    const message = req.query.msg || "Hello from Kubernetes!";
    fs.mkdirSync('/app/data', { recursive: true });
    fs.writeFileSync(DATA_FILE, message);
    return res.json({ written: message });
});

app.get("/read", (req, res) => {
    if (!fs.existsSync(DATA_FILE)) {
        return res.json({ message: "No data found" });
    }
    const message = fs.readFileSync(DATA_FILE, 'utf8');
    return res.json({ message });
});

app.use((req, res, next) => {
    const log = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
    console.log(log.trim());
    fs.mkdirSync('/app/logs', { recursive: true });
    fs.appendFileSync(LOG_FILE, log);
    next();
});

// Basic response
app.get("/", (req, res) => {
    return res.json({ message: "Hey, this is Yash-dev" });
});

// Simulate app going unhealthy


app.get("/health", (req, res) => {
    if (!isHealthy) {
        return res.status(500).json({ status: "unhealthy" });
    }
    return res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/crash", (req, res) => {
    isHealthy = false;
    return res.json({ message: "App marked as unhealthy! Watch the Pod restart." });
});

app.get("/recover", (req, res) => {
    isHealthy = true;
    return res.json({ message: "App recovered!" });
});

// Print environment variables
app.get("/env", (req, res) => {
    return res.json({
        APP_ENV: process.env.APP_ENV || "not set",
        APP_MESSAGE: process.env.APP_MESSAGE || "not set",
        DB_PASSWORD: process.env.DB_PASSWORD || "not set",
        PORT: process.env.PORT || "not set"
    });
});

app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));