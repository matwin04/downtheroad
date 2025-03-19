const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Handlebars
app.engine("html", engine({ extname: ".html", defaultLayout: false }));
app.set("view engine", "html");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
    res.render("index", { title: "Down The Road" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;