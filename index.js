const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.json({ message: "Express.js + TypeScript." });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
