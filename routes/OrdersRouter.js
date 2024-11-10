import express from 'express';
import Orders from '../models/orders.js';
import authChecker from "../middlewares/authChecker.js";
import Items from "../models/items.js";
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


router.post('/create-order', async (req, res) => {
    const user = await authChecker(req, res);
    if (!user) {
        return res.status(401).send({error: 'You are not logged in!'});
    }

    const {itemId, quantity, orderId} = req.body;

    if (!itemId) {
        return res.status(400).send({error: 'No items added'});
    }

    const item = await Items.findById(itemId);

    if (!item) {
        return res.status(400).send({error: 'Item not found'});
    }
    if (!quantity) {
        return res.status(400).send({error: 'At least 1 item is required!'});
    }

    const order = await Orders.findOne({_id: orderId, userId: user.id});

    if (!order || order.status !== orderStatus.NONE) {
        const totalPrice = item.price * quantity;
        const newOrder = await Orders.create({
            userId: user.id,
            items: [{itemId: itemId, quantity: quantity}],
            totalPrice: totalPrice,
        })
        return res.status(200).send(newOrder);
    } else {

        const existingItemIndex = order.items.findIndex(i => i.itemId.toString() === itemId);

        let updatedOrder;
        if (existingItemIndex > -1) {

            const updatedQuantity = order.items[existingItemIndex].quantity + quantity;
            const updatedTotalPrice = order.totalPrice + item.price * quantity;

            updatedOrder = await Orders.findOneAndUpdate(
                {_id: orderId, userId: user.id, "items.itemId": itemId},
                {
                    $set: {
                        "items.$.quantity": updatedQuantity,
                        totalPrice: updatedTotalPrice,
                    },
                },
                {new: true}
            );
        } else {
            const updatedTotalPrice = order.totalPrice + item.price * quantity;

            updatedOrder = await Orders.findOneAndUpdate(
                {_id: orderId, userId: user.id},
                {
                    $push: {items: {itemId: itemId, quantity: quantity}},
                    $set: {totalPrice: updatedTotalPrice},
                },
                {new: true}
            );
        }
        return res.status(200).send(updatedOrder);
    }

});




export default router;


