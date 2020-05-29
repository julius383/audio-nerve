import { Request, Response, Router } from "express";
import multer from "multer";

const router = Router();
const upload = multer();

router.post(
  "/search",
  upload.single("snippet"),
  (req: Request, res: Response) => {
    if (req.is("multipart/form-data")) {
      res.json({ msg: "Good request" });
    } else {
      res.sendStatus(400);
    }
  }
);

export { router };
