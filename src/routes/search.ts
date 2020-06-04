import { Request, Response, Router } from "express";
import multer, { FileFilterCallback } from "multer";
import logger from "../util/logger";

const UPLOAD_DIR = process.env.UPLOAD_DIR;
const router = Router();

if (UPLOAD_DIR === undefined) {
  throw new Error("UPLOAD_DIR has not been set");
}

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    logger.debug(`Uploaded file ${JSON.stringify(file.originalname)}`);

    cb(null, true);
  },
  storage,
});

router.post(
  "/search",
  upload.single("snippet"),
  (req: Request, res: Response) => {
    if (req.is("multipart/form-data")) {
      // Send file to chromaprint for fingerprinting here. The file name is accessible
      // from req.file.filename. Afterwards, have it run the comparison code and return
      // a possible match in the response
      res.json({ msg: "Good request" });
    } else {
      res.sendStatus(400);
    }
  }
);

export { router };
