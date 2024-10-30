import jwt from "jsonwebtoken";
import {JWT_SECRET} from "../constants.js";
import Users from "../models/users.js";

async function authChecker(req, res) {
    const token = req.headers.authorization;
    if (!req.body) {
        return res.status(400).send({ error: 'Validation failed' });
    }

    if (!token) {
        return res.status(401).send({ error: 'No token provided' });
    }

    // Strip "Bearer" prefix if present
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    // Verify JWT
    let verificationResult;
    try {
        verificationResult = jwt.verify(cleanToken, JWT_SECRET);
    } catch (error) {
        return res.status(401).send({ error: 'Invalid token' });
    }

    const { id } = verificationResult;

    const user = await Users.findOne({ _id: id });
    if (!user) {
        return res.status(401).send({ error: 'User not found' });
    }
    return user;
}

export default authChecker;