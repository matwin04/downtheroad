import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { engine } from 'express-handlebars';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;
const db = new Database('roads.db');

app.engine("html", engine({ extname: ".html", defaultLayout: false }));
app.set("view engine", "html");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
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

// Get all roads
app.get('/roads', (req, res) => {
    const roads = db.prepare('SELECT * FROM roads').all();
    res.json(roads);
});

// Get a specific road by ID
app.get('/roads/:id', (req, res) => {
    const road = db.prepare('SELECT * FROM roads WHERE id = ?').get(req.params.id);
    road ? res.json(road) : res.status(404).json({ error: 'Road not found' });
});

// Render homepage with roads
app.get('/', (req, res) => {
    const roads = db.prepare('SELECT * FROM roads').all();
    res.render('index', { roads });
});

// Add a new road
app.post('/roads', (req, res) => {
    const { name, location, description, difficulty, rating } = req.body;
    const stmt = db.prepare('INSERT INTO roads (name, location, description, difficulty, rating) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, location, description, difficulty, rating);
    res.json({ id: info.lastInsertRowid, name, location, description, difficulty, rating });
});

// Update a road
app.put('/roads/:id', (req, res) => {
    const { name, location, description, difficulty, rating } = req.body;
    const stmt = db.prepare('UPDATE roads SET name = ?, location = ?, description = ?, difficulty = ?, rating = ? WHERE id = ?');
    const info = stmt.run(name, location, description, difficulty, rating, req.params.id);
    info.changes ? res.json({ message: 'Updated successfully' }) : res.status(404).json({ error: 'Road not found' });
});

// Delete a road
app.delete('/roads/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM roads WHERE id = ?');
    const info = stmt.run(req.params.id);
    info.changes ? res.json({ message: 'Deleted successfully' }) : res.status(404).json({ error: 'Road not found' });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
