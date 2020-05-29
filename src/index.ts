import express, {
  ErrorRequestHandler,
  Request,
  Response,
  NextFunction,
} from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

import logger from "./util/logger";
import { router as authRouter } from "./routes/auth";
import { router as searchRouter } from "./routes/search";
import { MulterError } from "multer";

const PORT: string = process.env.PORT || "8000";

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello from Audio Nerve");
});

app.use("/api", authRouter);
app.use("/api", searchRouter);

interface ErrorObj {
  name: string;
  message: string;
}

app.use(
  (
    err: ErrorRequestHandler,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    logger.debug(JSON.stringify(err));
    if (err.name === "UnauthorizedError") {
      const errorObj = (err as object) as ErrorObj;
      const errorMsg =
        errorObj.message === "jwt expired" ? "Expired token" : "Invalid token";
      res.status(401).json({ error: errorMsg });
    } else if (err instanceof MulterError) {
      if (err.name === "Unexpected field") {
        res.status(400).json({ error: "Invalid upload format" });
      } else {
        logger.error(`Multer error => ${err.message}`);
        res.sendStatus(400);
      }
    }
  }
);

app.listen(PORT, () => {
  logger.debug(`Started app on http://localhost:${PORT}`);
});
