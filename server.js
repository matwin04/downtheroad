const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database("roads.db");

// Configure Handlebars
app.engine("html", engine({ extname: ".html", defaultLayout: false }));
app.set("view engine", "html");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Create roads table if not exists
db.exec(`CREATE TABLE IF NOT EXISTS roads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    difficulty TEXT,
    rating INTEGER
)`);

const getLinks = (filename) => {
    try {
        const filePath = path.join(__dirname, "public", filename);
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return data;
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
};

// Get all roads
app.get("/roads", (req, res) => {
    const roads = db.prepare("SELECT * FROM roads").all();
    res.json(roads);
});

// Render homepage with roads
app.get("/", (req, res) => {
    const roads = db.prepare("SELECT * FROM roads").all();
    res.render("index", { title: "DownTheRoad", roads });
});

// Add a new road
app.post("/roads", (req, res) => {
    const { name, location, description, difficulty, rating } = req.body;
    const stmt = db.prepare("INSERT INTO roads (name, location, description, difficulty, rating) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(name, location, description, difficulty, rating);
    res.json({ id: info.lastInsertRowid, name, location, description, difficulty, rating });
});

// Update a road
app.put("/roads/:id", (req, res) => {
    const { name, location, description, difficulty, rating } = req.body;
    const stmt = db.prepare("UPDATE roads SET name = ?, location = ?, description = ?, difficulty = ?, rating = ? WHERE id = ?");
    const info = stmt.run(name, location, description, difficulty, rating, req.params.id);
    info.changes ? res.json({ message: "Updated successfully" }) : res.status(404).json({ error: "Road not found" });
});

// Delete a road
app.delete("/roads/:id", (req, res) => {
    const stmt = db.prepare("DELETE FROM roads WHERE id = ?");
    const info = stmt.run(req.params.id);
    info.changes ? res.json({ message: "Deleted successfully" }) : res.status(404).json({ error: "Road not found" });
});

// Vercel support: Export Express app
module.exports = app;

// Start server locally
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
