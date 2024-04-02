import express, { Express, Request, Response } from "express";
const app: Express = express();
const port = 3000;

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Express.js + TypeScript." });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
