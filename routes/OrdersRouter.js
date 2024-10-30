import express from 'express';
import Orders from '../models/orders.js';
import authChecker from "../middlewares/authChecker.js";
import {orderStatus} from "../constants.js";

const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const allOrders = await Orders.find();
        res.send(allOrders);
    } catch (err) {
        res.status(500).send({error: err.message});
    }
})


export default router;
