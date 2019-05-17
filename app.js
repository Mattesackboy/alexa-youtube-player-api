'use-strict'

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const ytdl = require('youtube-dl')
const { promisify } = require('util')
const getInfoFromUrl = promisify(ytdl.getInfo)
/**
 * Matcha solo url di yt
 * Urls type:
 * www.youtube.com, youtube.com, m.youtube.com, youtu.be
 */
const urlRegex = /^(https?\:\/\/)?(www\.)?(m\.youtube\.com|youtube\.com|youtu\.?be)\/.+$/

const DATABASE_URI = "mongodb+srv://matteo-nodejs-course:3hhcuXY5TkMVsPHy@cluster0-dxehz.gcp.mongodb.net/alexa-youtube-player?retryWrites=true"

const User = require('./models/user'), Song = require('./models/song')

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(async (req, res, next) => {
    req.user = await User.findById('5cdef65db9be9576d597cf01') //dummy user
    next()
})

app.get('/add-songs', (req, res, next) => {
    return res.send(`
        <html>
            <head></head>
            <body>
                <form action="/add-song-to-queue" method="POST">
                    <label for="songUrl">YT URL</label>
                    <input name="songUrl" type="text" placeholder="Youtube video url"></input>
                    <button type="submit">Add to Queue</button>
                </form>
            </body>
        </html>
    `)
})

app.post('/add-song-to-queue', async (req, res, next) => {
    const body = req.body, songUrl = body.songUrl //|| "https://www.youtube.com/watch?v=tP-F6pKJQAk"
    //TODO: usare model
    if (!urlRegex.test(songUrl)) return res.status(400).json({ result: "error", message: "", data: null })

    try {
        const songInfo = await getInfoFromUrl(songUrl)
        let song = await Song.findOne({ ytId: songInfo.id }) //vedo se c'è una canzone nel db con questo id
        if (!song) {
            song = new Song({
                title: songInfo.title,
                artist: songInfo.uploader,
                url: songInfo.url,
                ytId: songInfo.id, //univoco
                thumbnail: songInfo.thumbnail
            })
            await song.save()
        }
        await req.user.addToQueue(song)
    } catch(err) {
        console.log(err)
        return res.status(500).json({ result: "error", message: "internal server error" })
        //1) Errore di yt-dl oppure
        //2) Errore MongoDB: mancano parametri/song duplicata (più probabile)
    }
    res.send("Added to queue!")
})

app.post('/next-song', async (req, res, next) => {
    req.user = await req.user.populate('queue.songId').execPopulate()
    const nextSong = await req.user.getNextSongFromQueue() //o ritorna una song o undefined
    if (!nextSong) return res.status(200).json({ result: "success", message: "Queue is empty" })
    res.status(200).json({ result: "success", message: "", data: {
        song: {
            title: nextSong.title,
            artist: nextSong.artist,
            url: nextSong.url,
            thumbnail: nextSong.thumbnail
        },
        lastsInQueue: req.user.queue.length
    }}) 
})

mongoose.connect(DATABASE_URI, { useNewUrlParser: true }).then(async () => {
    //dummy user
    const user = await User.findOne()
    if (!user) {
        const user = new User({
            email: 'matteobrogin@test.com',
            password: 'hashed-password-xd',
            queue: []
        })
        await user.save()
    }
    app.listen(process.env.PORT || 3000, () => {
        console.log("Listening on port 3000")
    })
})