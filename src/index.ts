import * as express from "express";

import logger from "./util/logger";

const app = express();
const PORT: string = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello from Audio Nerve");
});

app.listen(PORT, () => {
  logger.debug(`Started app on http://localhost:${PORT}`);
});
