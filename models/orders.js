import mongoose from 'mongoose';
import orderSchema from '../schemas/orders.js';
import {Collections} from "../constants.js";

const Orders = new mongoose.model(Collections.ORDERS, orderSchema);

export default Orders;