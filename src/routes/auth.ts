import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";
import expressJwt from "express-jwt";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import logger from "../util/logger";

const prisma = new PrismaClient();
const router = Router();
const ROUNDS = 10;
const TOKEN_SECRET = process.env.TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const TOKEN_EXP = 60 * 15;
const REFRESH_EXP = 60 * 60 * 24 * 14;

if (TOKEN_SECRET === undefined) {
  throw new Error("TOKEN_SECRET has not been set");
} else if (REFRESH_SECRET === undefined) {
  throw new Error("REFRESH_TOKEN has not been set");
}

const generateJWT = (
  email: string,
  id: string,
  expSec: number,
  TOKEN: string
): string => {
  const now = new Date();
  const exp = new Date(now);
  exp.setSeconds(now.getSeconds() + expSec);
  return jwt.sign(
    {
      id,
      email,
      exp: exp.getTime() / 1000,
      iat: now.getTime() / 1000,
    },
    TOKEN
  );
};

export const getTokenFromHeader = (req: Request): string | null => {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
};

interface DecodedToken {
  user: { id: string; email: string };
}

router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
  } else if (!email) {
    res.status(400).json({ error: "Email is required" });
  } else if (!password) {
    res.status(400).json({ error: "Password is required" });
  } else {
    try {
      const hashPassword = await bcrypt.hash(password, ROUNDS);
      const isExistingEmail = await prisma.user.findOne({ where: { email } });
      if (isExistingEmail) {
        res.status(400).json({ error: "This email is already taken" });
      } else {
        await prisma.user.create({
          data: {
            id: uuidv4(),
            name,
            email,
            password: hashPassword,
          },
        });
        res.status(201).json({ msg: "User created successfully" });
      }
    } catch (err) {
      logger.error(JSON.stringify(err));
      res.sendStatus(500);
    }
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({
      error: "Email is required",
    });
  } else if (!password) {
    res.status(400).json({
      error: "Password is required",
    });
  } else {
    try {
      const user = await prisma.user.findOne({ where: { email } });
      if (user !== null) {
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
          const token = generateJWT(
            user.email,
            user.id,
            TOKEN_EXP,
            TOKEN_SECRET
          );
          res.json({
            token,
            refreshToken: generateJWT(
              user.email,
              user.id,
              REFRESH_EXP,
              REFRESH_SECRET
            ),
          });
        } else {
          res.status(400).json({ error: "Incorrect email or password" });
        }
      } else {
        res.status(400).json({ error: "Account does not exist" });
      }
    } catch (err) {
      logger.error(JSON.stringify(err));
      res.sendStatus(500);
    }
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.status(200).end();
});

router.get(
  "/user",
  expressJwt({ secret: TOKEN_SECRET, getTokenFromHeader }),
  async (req: Request, res: Response) => {
    const { user: token } = (req as object) as DecodedToken;
    if (token) {
      const user = await prisma.user.findOne({
        where: { email: token.email },
      });
      if (user != null) {
        res.json({
          name: user.name,
          email: user.email,
        });
      } else {
        res.status(401).json({ error: "Invalid token" });
      }
    } else {
      res.sendStatus(400);
    }
  }
);

router.get(
  "/refresh",
  expressJwt({ secret: REFRESH_SECRET, getTokenFromHeader }),
  async (req: Request, res: Response) => {
    const { user: token } = (req as object) as DecodedToken;
    if (token) {
      const user = await prisma.user.findOne({
        where: { email: token.email },
      });
      if (user != null) {
        const newToken = generateJWT(
          user.email,
          user.id,
          TOKEN_EXP,
          TOKEN_SECRET
        );
        res.json({ token: newToken });
      } else {
        res.status(401).json({ error: "Invalid token" });
      }
    } else {
      res.sendStatus(400);
    }
  }
);

export { router };
