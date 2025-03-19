const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");
const fs = require("fs");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Use Vercel's env var
    ssl: { rejectUnauthorized: false } // Required for Neon
});

// Configure Handlebars
app.engine("html", engine({ extname: ".html", defaultLayout: false }));
app.set("view engine", "html");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Create roads table if not exists
pool.query(`
    CREATE TABLE IF NOT EXISTS roads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        difficulty TEXT,
        rating INTEGER
    )
`);

// Get all roads
app.get("/roads", async (req, res) => {
    const result = await pool.query("SELECT * FROM roads");
    res.json(result.rows);
});

// Render homepage with roads
app.get("/", async (req, res) => {
    const result = await pool.query("SELECT * FROM roads");
    res.render("index", { title: "DownTheRoad", roads: result.rows });
});

// Add a new road
app.post("/roads", async (req, res) => {
    const { name, location, description, difficulty, rating } = req.body;
    const result = await pool.query(
        "INSERT INTO roads (name, location, description, difficulty, rating) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, location, description, difficulty, rating]
    );
    res.json(result.rows[0]);
});

// Update a road
app.put("/roads/:id", async (req, res) => {
    const { name, location, description, difficulty, rating } = req.body;
    const result = await pool.query(
        "UPDATE roads SET name = $1, location = $2, description = $3, difficulty = $4, rating = $5 WHERE id = $6 RETURNING *",
        [name, location, description, difficulty, rating, req.params.id]
    );
    res.json(result.rowCount ? { message: "Updated successfully" } : { error: "Road not found" });
});

// Delete a road
app.delete("/roads/:id", async (req, res) => {
    const result = await pool.query("DELETE FROM roads WHERE id = $1 RETURNING *", [req.params.id]);
    res.json(result.rowCount ? { message: "Deleted successfully" } : { error: "Road not found" });
});

// Vercel support: Export Express app
module.exports = app;

// Start server locally
if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}