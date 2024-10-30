import express from 'express';
import Items from "../models/items.js";
import {Roles} from "../constants.js";
import authChecker from "../middlewares/authChecker.js";

const router = express.Router();

async function adminChecker(req, res) {
    const user = await authChecker(req, res);
    if (user && user.role !== Roles.ADMIN) {
        return res.status(403).send({ error: 'Operation not allowed' });
    }
}


router.get('/', async (req, res) => {
    try {
        const allItems = await Items.find({});
        res.send(allItems);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err.message});
    }
});

router.post('/add', async (req, res) => {
    const {name, description, price} = req.body;
    try {
        await adminChecker(req, res)
    } catch (err) {
        res.status(500).send({error: err.message})
    }
    try {
        const newItem = await Items.create({name, description, price});
        res.status(200).send(newItem);
    } catch (err) {
        res.status(500).send({error: err.message});
    }
});

router.patch('/update/:id', async (req, res) => {
    try {
        await adminChecker(req, res);
    } catch (err) {
        res.status(500).send({error: err.message})
    }
    const {name, description, availability, price} = req.body;

    try {
        const item = await Items.findById(req.params.id);
        if (!item) {
            return res.status(404).send({error: 'Item not found'});
        }

        const updatedItem = await Items.findByIdAndUpdate(
            {_id: req.params.id},
            {name, description, availability, price},
            {new: true}
        );

        res.status(200).send(updatedItem);
    } catch (err) {
        res.status(500).send({error: err.message});
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        await adminChecker(req, res);
    } catch (err) {
        res.status(500).send({error: err.message})
    }
    const itemDeleteId = req.params.id;
    try {


        const item = await Items.findById(itemDeleteId);
        if (!item) {
            return res.status(404).send({error: 'Item not found'});
        }

        await Items.deleteOne({_id: itemDeleteId});
        res.status(200).send({message: "Item deleted successfully"});
    } catch (err) {
        res.status(500).send({error: err.message});
    }
})

router.get('/:id', async (req, res) => {


    try {
        const id = req.params.id;
        const item = await Items.findById(id);
        if (!item) {
            return res.status(404).send({error: 'Item not found'});
        }
        return res.status(200).send(item);
    } catch (err) {
        res.status(500).send({error: err.message});
    }
})

router.get('/all', async (req, res) => {
    try {
        const allItems = await Items.find();
        res.status(200).send(allItems);
    } catch (err) {
        res.status(500).send({error: err.message});
    }
})


router.post('/:price', async (req, res) => {
    const maxPrice = Number(req.params.price);
    try {
        const allItemsMaxPrice = await Items.find({price: {$lte: maxPrice}});
        res.status(200).send(allItemsMaxPrice);
    } catch (err) {
        res.status(500).send({error: err.message});
    }
});

router.get('/status/:availability', async (req, res) => {
    try {
        const availabilityItem = await Items.find({availability: req.params.availability});
        res.status(200).send(availabilityItem);
    } catch (err) {
        res.status(500).send({error: err.message});
    }
})


export default router;
