const express = require('express');

const router = express.Router()

module.exports = router;

const Model = require('../models/model')

//Post Method
router.post('/post', async (req, res) => {
    console.log(req.body);
    const data = new Model({
        user: req.body.user,
        category: req.body.category,
        name: req.body.name,
        power: req.body.power
    })
    try{
        const dataToSave = await data.save();
        res.status(200).json(dataToSave);
    } catch(error) {
        res.status(400).json({message: error.message});
        console.log(error.message)
    }
})