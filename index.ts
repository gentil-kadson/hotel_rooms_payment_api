import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();
const app: Express = express();
const port = process.env.PORT;

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Express.js + TypeScript." });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
