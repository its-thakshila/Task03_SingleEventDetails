const express = require("express");
const app = express();
const PORT = 3000;

// middleware
app.use(express.json());

// route
app.get("/", (req, res) => {
    res.send("Hello, Express is running 🚀");
});

// start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
