import express from 'express';
import Orders from '../models/orders.js';
import authChecker from "../middlewares/authChecker.js";
import Items from "../models/items.js";
import {orderStatus, Roles as roles, Roles} from "../constants.js";

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

    const {itemId, quantity, orderId, postalAddress} = req.body;

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

        if (!postalAddress) {
            return res.status(400).send({error: 'Postal address is required'});
        }
        const totalPrice = item.price * quantity;
        const newOrder = await Orders.create({
            userId: user.id,
            items: [{itemId: itemId, quantity: quantity}],
            totalPrice: totalPrice,
            postalAddress: postalAddress,
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
        res.status(200).send(updatedOrder);
    }

});


router.patch("/remove-item", async (req, res) => {
    const user = await authChecker(req, res);
    if (!user) {
        return res.status(401).send({error: 'You are not logged in!'});
    }

    const {orderId, itemId} = req.body;
    if (!orderId) {
        return res.status(400).send({error: 'Order id is required!'});
    }

    const order = await Orders.findById({_id: orderId, userId: user.id});
    if (!order || order.status !== orderStatus.NONE) {
        return res.status(404).send({error: 'Order not found'});
    }

    const itemInOrder = order.items.find(i => i.itemId.toString() === itemId);
    if (!itemInOrder) {
        return res.status(404).send({error: 'Item not found in order'});
    }

    const item = await Items.findById(itemInOrder.itemId);
    if (!item) {
        return res.status(404).send({error: 'Item not found'});
    }

    if (itemInOrder.quantity > 1) {

        const updatedQuantity = itemInOrder.quantity - 1;
        const updatedTotalPrice = order.totalPrice - item.price;

        const updatedOrder = await Orders.findOneAndUpdate(
            {_id: orderId, userId: user.id},
            {
                $set: {"items.$[elem].quantity": updatedQuantity},
                totalPrice: updatedTotalPrice
            },
            {
                arrayFilters: [{"elem.itemId": itemId}],
                new: true
            }
        );

        return res.status(200).send(updatedOrder);
    } else {

        const updatedOrder = await Orders.findOneAndUpdate(
            {_id: orderId, userId: user.id},
            {$pull: {items: {itemId: itemId}}},
            {new: true}
        );
        if (updatedOrder.items.length === 0) {
            await Orders.findByIdAndDelete(orderId);
            return res.status(200).send({message: "Order deleted as there are no items left"});
        }

        res.status(200).send(updatedOrder);
    }
});

router.patch("/edit-postalAddress", async (req, res) => {
    const user = await authChecker(req, res);

    if (!user) {
        return res.status(401).send({error: 'You are not logged in!'});
    }

    const {postalAddress, orderId} = req.body;

    if (!postalAddress) {
        return res.status(401).send({error: 'Postal address is required'});
    }
    const order = await Orders.findOne({_id: orderId, userId: user.id});

    if (!order || order.status !== orderStatus.NONE) {
        return res.status(404).send({error: 'Order not found'});
    }

    try {
        const updatedOrder = await Orders.findOneAndUpdate({
            _id: orderId,
            userId: user.id
        }, {postalAddress: postalAddress}, {new: true});
        res.status(200).send(updatedOrder);
    } catch (err) {
        res.status(500).send({error: err.message});
    }

})

router.patch("/confirm-order-user", async (req, res) => {
    const user = await authChecker(req, res);

    if (!user) {
        return res.status(401).send({error: 'You are not logged in!'});
    }

    const {orderId} = req.body;

    if (!orderId) {
        return res.status(401).send({error: 'Order id is required!'});
    }
    const order = await Orders.findOne({_id: orderId, userId: user.id});

    if (!order || order.status !== orderStatus.NONE) {
        return res.status(404).send({error: 'Order not found'});
    }
    try {
        const updatedOrder = await Orders.findOneAndUpdate({
            _id: orderId,
            userId: user.id
        }, {status: orderStatus.PENDING}, {new: true});
        res.status(200).send(updatedOrder);
    } catch (err) {
        res.status(500).send({error: err.message});
    }

})

router.patch("/change-status-admin", async (req, res) => {
    const user = await authChecker(req, res);
    if (user && user.role !== Roles.ADMIN) {
        return res.status(403).send({error: 'Operation not allowed'});
    }

    const {orderId, status} = req.body;

    if (!orderId) {
        return res.status(401).send({error: 'Order id is required!'});
    }
    const order = await Orders.findOne({_id: orderId, userId: user.id});

    if (!order || order.status !== orderStatus.PENDING) {
        return res.status(404).send({error: 'Order not found | Operation not allowed'});
    }
    try {
        const updatedOrder = await Orders.findOneAndUpdate({
            _id: orderId,
            userId: user.id
        }, {status: status}, {new: true});
        res.status(200).send(updatedOrder);
    } catch (err) {
        res.status(500).send({error: err.message});
    }

})

router.delete("/delete-order", async (req, res) => {
    const user = await authChecker(req, res);

    if (!user) {
        return res.status(401).send({error: 'You are not logged in!'});
    }

    const {orderId} = req.body;

    try {
        await Orders.findByIdAndDelete(orderId);
        res.status(200).send({message: "Order deleted successfully"});
    } catch (err) {
        res.status(500).send({error: err.message})
    }
})

router.post("/find-orderById", async (req, res) => {
    const user = await authChecker(req, res);
    if (!user) {
        return res.status(404).send({error: 'You are not logged in!'});
    }
    const {orderId} = req.body;
    if (!orderId) {
        res.status(400).send({error: 'Order id is required!'});
    }
    try {
        const order = await Orders.findById(orderId);
        if (user.id === order.userId || user.role === roles.ADMIN) {
            res.status(200).send(order);
        } else {
            return res.status(403).send({error: "Operation not allowed!"})
        }

    } catch (err) {
        res.status(500).send({error: err.message});
    }
})

export default router;


