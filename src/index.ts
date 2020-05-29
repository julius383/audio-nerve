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

const PORT: string = process.env.PORT || "8000";

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello from Audio Nerve");
});

app.use("/api", authRouter);

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
    }
  }
);

app.listen(PORT, () => {
  logger.debug(`Started app on http://localhost:${PORT}`);
});
