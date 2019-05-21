'use strict'

const mongoose = require('mongoose')
const { google } = require('googleapis')
const youtube = google.youtube({
    version: "v3",
    auth: "AIzaSyA1A18StsEUF0rC816XKd68Oe_HI8cgpN0"
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

exports.nextSong = async (req, res, next) => {
    const body = req.body, requireNextSong = !!body.requireNextSong
    console.log("Next Song called. Body:", body)
    req.user = await req.user.populate('queue.songId').execPopulate()
    const nextSong = await req.user.getNextSongFromQueue(requireNextSong) //o ritorna una song o undefined
    if (!nextSong) return res.status(200).json(new Response("success", "Queue is empty"))
    res.status(200).json(new Response("success", "", {
        song: {
            title: nextSong.title,
            artist: nextSong.artist,
            url: nextSong.url,
            thumbnail: nextSong.thumbnail
        },
        lastsInQueue: req.user.queue.length
    })) 
}

exports.addToQueue = async (req, res, next) => {
    const body = req.body, songUrl = body.songUrl //|| "https://www.youtube.com/watch?v=tP-F6pKJQAk"
    
    if (!urlRegex.test(songUrl)) return res.status(400).json(new Response("error", "Bad URL sent"))

    try {
        const songInfo = await getInfoFromUrl(songUrl)
        if (songInfo._duration_raw > 380) return res.status(200).json(new Response("error", "Song duration exceed the 6min limit"))
        let song = await Song.findOne({ ytId: songInfo.id }) //vedo se c'è una canzone nel db con questo id
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
    if (!query) return res.status(400).json(new Response("error", "bad req"))

    if (urlRegex.test(query)) { //query è un yt url
        req.body.songUrl = query
        return this.addToQueue(req, res, next)
    }

    try {
        const videos = await searchOnYoutube(query)
        res.status(200).json(new Response("success", "", videos))
    } catch(err) {
        console.error(err)
        res.status(500).json(new Response("error", "Internal server error"))
    }
}

exports.getCurrentUserQueue = async (req, res, next) => {
    req.user = await req.user.populate('queue.songId').populate('nextSong').execPopulate()
    const queue = (await req.user.getQueue()).map(song => {
        return {
            title: song.songId.title,
            thumbnail: song.songId.thumbnail
        }
    })
    res.status(200).json(new Response("success", "Got current queue!", {
        nextSong: req.user.getTheNextSong(),
        queue: queue
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
        maxResults: 10,
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