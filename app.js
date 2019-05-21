'use strict'

const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')

const DATABASE_URI = "mongodb+srv://matteo-nodejs-course:3hhcuXY5TkMVsPHy@cluster0-dxehz.gcp.mongodb.net/alexa-youtube-player?retryWrites=true"

//Models
const User = require('./models/user'), Response = require('./models/response')
//Routes
const playerRoutes = require('./routes/player')

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(async (req, res, next) => {
    req.user = await User.findById('5cdef65db9be9576d597cf01') //dummy user
    next()
})

app.use('/api', playerRoutes)

app.get('/add-songs', (req, res, next) => {
    return res.send("You should not be here :)")
    return res.send(`
        <html>
            <head></head>
            <body>
                <form action="/api/add-song-to-queue" method="POST">
                    <label for="songUrl">YT URL</label>
                    <input name="songUrl" type="text" placeholder="Youtube video url"></input>
                    <button type="submit">Add to Queue</button>
                </form>
            </body>
        </html>
    `)
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
    app.listen(process.env.PORT || 3288, '0.0.0.0', () => {
        console.log("Listening...")
    })
})