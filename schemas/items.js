import mongoose from "mongoose";
import {ItemAvailability} from "../constants.js";

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        max: 150,
        required: false,
    },
    availability: {
        type: String,
        enum: [ItemAvailability.AVAILABLE, ItemAvailability.NOT_AVAILABLE],
        default: ItemAvailability.AVAILABLE,
    },
    price: {
        type: Number,
        required: true,
    }
})


export default itemSchema;