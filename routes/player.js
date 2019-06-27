'use strict'

const { Router } = require('express')
const router = Router()

const playerController = require('../controllers/player')

router.post('/add-song-to-queue', playerController.addToQueue)
router.post('/next-song', playerController.nextSong)
router.post('/enqueued-song', playerController.getEnqueuedSong)
router.post('/search', playerController.youtubeSearch)
router.post('/get-queue', playerController.getCurrentUserQueue)

/*router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', shopController.getCart);

router.post('/cart', shopController.postCart);

router.post('/cart-delete-item', shopController.postCartDeleteProduct);

router.post('/create-order', shopController.postOrder);

router.get('/orders', shopController.getOrders);*/

module.exports = router
