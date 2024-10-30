import mongoose from "mongoose";

import itemSchema from "../schemas/items.js";
import {Collections} from "../constants.js";

const Items = new mongoose.model(Collections.ITEMS, itemSchema);

export default Items;