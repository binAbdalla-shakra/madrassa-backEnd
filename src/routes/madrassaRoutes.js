const express = require('express');
const {
    createmadrassa,
    getmadrassa,
    updatemadrassa,
    deletemadrassa,
} = require('../controllers/madrassaController');

const router = express.Router();

router.post('/', createmadrassa);
router.get('/', getmadrassa);
router.put('/:id', updatemadrassa);
router.delete('/:id', deletemadrassa);

module.exports = router;
