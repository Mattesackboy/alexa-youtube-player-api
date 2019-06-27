'use strict'

const config = require('../config/config')
const mongoose = require('mongoose')
const { google } = require('googleapis')
const youtube = google.youtube({
    version: "v3",
    auth: config.app.youtubeAPIKey
})
const ytdl = require('youtube-dl')
const { promisify } = require('util')
const getInfoFromUrl = promisify(ytdl.getInfo)

//MODELS
const Song = require('../models/song'), Response = require('../models/response')

/**
 * Matcha solo url di yt
 * Urls type:
 * www.youtube.com, youtube.com, m.youtube.com, youtu.be
 */
const urlRegex = /^(https?\:\/\/)?(www\.)?(m\.youtube\.com|youtube\.com|youtu\.?be)\/.+$/

exports.addToQueue = async (req, res, next) => {
    const body = req.body, songUrl = body.songUrl //|| "https://www.youtube.com/watch?v=tP-F6pKJQAk"
    
    if (!urlRegex.test(songUrl)) return res.status(400).json(new Response("error", "Bad URL sent"))

    try {
        const songInfo = await getInfoFromUrl(songUrl)
        if (songInfo._duration_raw > config.app.maxSongDurationInSeconds) return res.status(200).json(new Response("error", "Song duration limit exceeded"))
        let song = await Song.findOne({ ytId: songInfo.id }) //vedo se c'è una canzone nel db con questo ytId
        if (!song) {
            song = new Song({
                title: songInfo.title || "undefined",
                artist: songInfo.uploader || "undefined",
                url: songInfo.url,
                ytId: songInfo.id, //univoco
                thumbnail: songInfo.thumbnail || "undefined"
            })
            await song.save()
        }
        await req.user.addToQueue(song)
    } catch (err) {
        console.log(err)
        //1) Errore di yt-dl oppure
        //2) Errore MongoDB: mancano parametri/song duplicata (più probabile)
        return res.status(500).json(new Response("error", "Internal Server Error"))
    }
    res.status(200).json(new Response("success", "Added to queue!"))
}

exports.youtubeSearch = async (req, res, next) => {
    const query = req.body.query
    if (!query) return res.status(400).json(new Response("error", "Bad Request Sent"))

    if (urlRegex.test(query)) { //query è un yt url
        req.body.songUrl = query
        return this.addToQueue(req, res, next)
    }

    try {
        const videos = await searchOnYoutube(query)
        res.status(200).json(new Response("success", "Got videos", videos))
    } catch(err) {
        console.error(err)
        res.status(500).json(new Response("error", "Internal server error"))
    }
}

exports.getCurrentUserQueue = async (req, res, next) => {
    req.user = await req.user.populate('currentQueue.queue.songId')
    .populate('currentQueue.willPlay')
    .populate('currentQueue.nextSong')
    .execPopulate()
    const queue = (await req.user.getCurrentQueue()).queue.map(song => {
        return {
            title: song.songId.title,
            thumbnail: song.songId.thumbnail
        }
    })
    res.status(200).json(new Response("success", "Got current queue!", {
        enqueuedSong: req.user.getWillPlaySong(),
        queue: queue
    })) 
}

/**
 * Alexa Skill Endpoints
 */

exports.nextSong = async (req, res, next) => {
    const body = req.body, isCurrentlyPlaying = !!body.isCurrentlyPlaying //TODO: nome da modificare

    console.log(`Next Song called at ${new Date()}. Body:`, body)

    req.user = await req.user.populate('currentQueue.queue.songId').populate('currentQueue.nextSong').execPopulate()
    const nextSong = await req.user.getNextSong(!isCurrentlyPlaying) //o ritorna una song o undefined
    if (!nextSong) return res.status(200).json(new Response("success", "Queue is empty"))
    res.status(200).json(new Response("success", "Got next song", {
        song: nextSong,
        lastsInQueue: req.user.currentQueue.queue.length + 1
    }))
}

exports.getEnqueuedSong = async (req, res, next) => {
    console.log("Enqueued Song called.")
    req.user = await req.user.populate('currentQueue.willPlay').populate('currentQueue.nextSong').execPopulate()
    //Se non c'è nessuna canzone già inserita in coda, vedo se c'è una `nextSong` (TODO: non funziona ancora perchè se ci sono altre song in queue si bugga e viene riprodotta due volte nextSong)
    let willPlaySong = req.user.getWillPlaySong()
    if (req.user.currentQueue.nextSong && !willPlaySong) willPlaySong = await req.user.getNextSong()
    if (!willPlaySong) return res.status(200).json(new Response("success", "No enqueued song"))
    res.status(200).json(new Response("success", "Got willPlay song", {
        song: willPlaySong
    }))
}

/**
 * 
 * @param {String} query 
 */
const searchOnYoutube = (query) => {
    return youtube.search.list({
        part: "id,snippet",
        q: query,
        maxResults: 25,
        type: "video"
    }).then(res => {
        const videos = res.data.items
        return videos.map(video => {
            return {
                title: video.snippet.title,
                autor: video.snippet.channelTitle,
                thumbnail: video.snippet.thumbnails.high.url,
                url: `https://youtube.com/watch?v=${video.id.videoId}`
            }
        })
    })
}