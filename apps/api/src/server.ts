import { app } from "./app";

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`Konvene API listening on :${port}`));
