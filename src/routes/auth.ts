import { PrismaClient } from "@prisma/client"
import { Router, Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import jwt from "jsonwebtoken";

import logger from "../util/logger";

const prisma = new PrismaClient()
const router = Router();
const ROUNDS = 10;
const JWT_SECRET = "SECretk3y"


passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
},
    async (email, password, done) => {
        try {
            const user = await prisma.user.findOne({ where: { email } })
            if (user !== null) {
                const isSamePassword = await bcrypt.compare(password, user.password);
                if (isSamePassword) {
                    done(null, user)
                } else {
                    done(null, false, { message: 'Incorrect email or password' });
                }
            } else {
                done(null, false, { message: "Account does not exist" })
            }
        } catch (err) {
            logger.error(JSON.stringify(err))
            done(err)
        }
    }
))

const generateJWT = (email: string, id: string): string => {
    const now = new Date();
    const expiresIn = new Date(now)
    expiresIn.setDate(now.getDate() + 7)
    return jwt.sign({
        id,
        email,
        exp: expiresIn.getTime() / 1000,
        iat: now.getTime() / 1000
    }, JWT_SECRET)
}

router.post("/register", async (req: Request, res: Response) => {
    const { name, email, password } = req.body
    try {
        const hashPassword = await bcrypt.hash(password, ROUNDS);
        await prisma.user.create({
            data: {
                id: uuidv4(),
                name,
                email,
                password: hashPassword,
            }
        })
        res.json({ "msg": "User created successfully" })
    } catch (err) {
        // ad-hoc error handling given there is no way of using types to ensure proper error handling

        if (err?.meta?.target?.includes("email")) {
            res.status(400).json({ "validation_error": "This email is already taken" })
        } else {
            logger.error(JSON.stringify(err))
            res.sendStatus(500)
        }

    }

})

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email) {
        res.status(400).json({
            error: "Email is required"
        })
    } else if (!password) {
        res.status(400).json({
            error: "Password is required"
        })
    }
    return passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err) {
            res.sendStatus(500)
        } else if (user) {
            const token = generateJWT(user.email, user.id)
            res.json({ token })
        } else {
            res.status(400).json({ error: info })
        }
    })(req, res, next)
})

router.post("/logout", (_req: Request, res: Response) => {
    res.status(200).end()
})

export { router }
