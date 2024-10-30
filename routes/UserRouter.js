import express from 'express';
import Users from '../models/users.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, Roles } from '../constants.js';

const saltRounds = 10;
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const allUsers = await Users.find({});
        res.send(allUsers);
    } catch (err) {
        console.log(err);
        res.status(500).send({ error: err.message });
    }
});

router.post('/signup', async (req, res) => {
    if (!req.body) {
        return res.status(400).send({ error: 'Validation failed' });
    }
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send({ error: 'Validation failed' });
    }
    const psswdRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
    if (password.length < 8 || !psswdRegex.test(password)) {
        return res.status(400).send({
            error: "Password must be 8-16 characters long, contain at least one number and one special character (!@#$%^&*), and consist of letters, numbers, and special characters only."
        });
    }
    try {
        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ error: 'Email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = await Users.create({ email, password: hashedPassword });
        res.status(201).send(newUser);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send({ error: 'Validation failed' });
    }

    try {
        const existingUser = await Users.findOne({ email });
        if (!existingUser) {
            return res.status(400).send({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(400).send({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: existingUser._id, email: existingUser.email, role: existingUser.role },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.status(200).send({ token, user: existingUser });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.get('/profile', async (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ error: 'No token provided' });
    }
    try {
        const verificationResult = jwt.verify(token, JWT_SECRET);
        const { id } = verificationResult;

        const user = await Users.findOne({ _id: id });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        res.status(200).send({ user });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.patch('/:id', async (req, res) => {
    const userToUpdatedId = req.params.id;
    const { firstName, lastName, age, email, role, password } = req.body;
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ error: 'No token provided' });
    }

    try {
        const verificationResult = jwt.verify(token, JWT_SECRET);
        const { id } = verificationResult;

        const user = await Users.findOne({ _id: id });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        if (userToUpdatedId !== user.id && user.role !== Roles.ADMIN) {
            return res.status(403).send('Not allowed to update');
        }

        const userToUpdate = await Users.findById(userToUpdatedId);
        if (!userToUpdate) {
            return res.status(404).send({ error: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const updatedUser = await Users.findByIdAndUpdate(userToUpdatedId, {
            firstName,
            lastName,
            age,
            password: hashedPassword,
            role,
            email
        }, { new: true });

        res.status(200).send({ user: updatedUser });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.get('/all', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).send({ error: 'No token provided' });
    }

    try {
        const verificationResult = jwt.verify(token, JWT_SECRET);
        const { id } = verificationResult;

        const user = await Users.findOne({ _id: id });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        if (user.role !== Roles.ADMIN) {
            return res.status(403).send("Operation not allowed");
        }

        const users = await Users.find({});
        res.status(200).send({ users });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    const token = req.headers.authorization;
    const userToDeleteID = req.params.id;

    if (!token) {
        return res.status(401).send({ error: 'No token provided' });
    }

    try {
        const verificationResult = jwt.verify(token, JWT_SECRET);
        const { id } = verificationResult;

        const user = await Users.findById(id);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        if (userToDeleteID !== user.id && user.role !== Roles.ADMIN) {
            return res.status(403).send("Operation not allowed");
        }

        await Users.deleteOne({ _id: userToDeleteID });
        res.status(200).send({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

router.get('/singleEndpointMiddleware', (req, res) => {
    res.status(200).send("Response");
});

export default router;
