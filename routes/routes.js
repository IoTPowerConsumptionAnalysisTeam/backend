const express = require('express');

const router = express.Router()

module.exports = router;

//Post Method
router.post('/post', (req, res) => {
    res.send('Post API')
})