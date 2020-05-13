import { PrismaClient } from "@prisma/client"
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";


const prisma = new PrismaClient()
const router = Router();
const ROUNDS = 10;


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
            res.sendStatus(500)
        }

    }

})

router.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body
    try {
        const user = await prisma.user.findOne({ where: { email } })
        if (password !== undefined && user !== null) {
            const isSamePassword = await bcrypt.compare(password, user.password);
            if (isSamePassword) {
                res.json({ user })
            } else {
                res.status(400).json({ 'error': "Incorrect email or password" })
            }
        } else {
            res.status(400).json({ 'error': "Incorrect email or password" })
        }
    } catch (err) {
        res.sendStatus(500)
    }
})

router.post("/logout", (_req: Request, res: Response) => {
    res.status(200).end()
})

export { router }
