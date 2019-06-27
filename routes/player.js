'use strict'

const { Router } = require('express')
const router = Router()

const playerController = require('../controllers/player')

//Called from Front-end
router.post('/add-song-to-queue', playerController.addToQueue)
router.post('/search', playerController.youtubeSearch)
router.post('/get-queue', playerController.getCurrentUserQueue)

//Called from Alexa Skill
router.post('/next-song', playerController.nextSong)
router.post('/enqueued-song', playerController.getEnqueuedSong)

module.exports = router
