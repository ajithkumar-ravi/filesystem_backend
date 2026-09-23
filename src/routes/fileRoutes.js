const express = require('express');
const controller = require('../controllers/fileController');

const router = express.Router();

router.get('/files', controller.getChildren);
router.get('/files/:id', controller.getOne);
router.post('/files', controller.createItem);
router.put('/files/:id', controller.updateItem);
router.patch('/files/:id/move', controller.moveItem);
router.delete('/files/:id', controller.deleteItem);

module.exports = router;
