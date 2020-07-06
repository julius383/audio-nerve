import { Request, Response, Router } from "express";
import { exec } from "child_process";
import { PrismaClient, SongGetPayload } from "@prisma/client";
import multer, { FileFilterCallback } from "multer";
import logger from "../util/logger";
import compareFingerprints from "../util/match";

const prisma = new PrismaClient();
const UPLOAD_DIR = process.env.UPLOAD_DIR;
const router = Router();

type SongMeta = SongGetPayload<{
  select: { musicbrainzId: true; fingerprint: true };
}>;

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

// exec(`fpcalc -raw -plain ${infile}`, (err, stdout, stderr) => {
// // const qstring = `{${stdout}}`;

// });
router.post(
  "/search",
  upload.single("snippet"),
  async (req: Request, res: Response) => {
    if (req.is("multipart/form-data")) {
      exec(
        `fpcalc -raw -json "${req.file.filename}"`,
        { cwd: "upload/" },
        async (err, stdout, stderr) => {
          if (err) {
            logger.error(err);
            res.sendStatus(500);
          }
          const asjson = JSON.parse(stdout);
          const qstring = `'{${asjson.fingerprint.join(",")}}'`;
          try {
            const results = await prisma.queryRaw<SongMeta[]>(
              `SELECT "musicbrainzId",fingerprint FROM public."Song" WHERE fingerprint && ${qstring};`
            );
            if (results.length === 0) {
              res.sendStatus(404);
            } else if (results.length === 1) {
              logger.debug("Only one found...returning");
              res.status(200).json(results[0].musicbrainzId);
            } else {
              logger.debug("Multiple found...comparing");
              let lowest = Infinity;
              let answer = "";
              results.forEach((item: SongMeta) => {
                const score = compareFingerprints(
                  item.fingerprint,
                  asjson.fingerprint
                );
                logger.debug(`${item.musicbrainzId} ${score}`);
                if (score < lowest) {
                  answer = item.musicbrainzId;
                  lowest = score;
                }
              });
              logger.debug(
                `Found ${results.length} candidates and chose ${answer}`
              );
              res.json({ msg: answer });
            }
          } catch (e) {
            logger.error(e.message);
          }
        }
      );
      // const qstring = "'{-462224921,1685271399,1685201423}'";
    } else {
      res.sendStatus(400);
    }
  }
);

export { router };
