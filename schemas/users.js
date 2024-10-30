import mongoose from "mongoose";

import {Roles} from '../constants.js';

const usersSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: false,
    },
    lastName: {
        type: String,
        required: false,
    },
    age: {
        type: Number,
        min: 18,
        required: false,

    },
    email: {
        type: String,
        required: true,
        unique: false,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        min: [8, "Password must be at least 8 characters"],
    },
    role: {
        type: String,
        enum: [Roles.ADMIN, Roles.USER],
        default: 'USER',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

export default usersSchema;
