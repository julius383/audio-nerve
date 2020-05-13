import express from "express";
import bodyParser from "body-parser";

import logger from "./util/logger";
import { router as authRouter } from "./routes/auth";

const PORT: string = process.env.PORT || "8000";
const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Hello from Audio Nerve");
});

app.use('/api/auth', authRouter);

app.listen(PORT, () => {
    logger.debug(`Started app on http://localhost:${PORT}`);
});
