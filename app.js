'use strict'

const config = require('./config/config')
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')

//Models
const User = require('./models/user')
//Routes
const playerRoutes = require('./routes/player')

const app = express()
app.use(express.static('public'));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(async (req, res, next) => { //MARK: Middleware nel caso di futuro multi-user, per auth
    req.user = await User.findOne() //dummy user
    next()
})

app.use('/api', playerRoutes) //all routes

app.get('/add-songs', (req, res, next) => {
    if (process.env.NODE_ENV === "production") return res.send("Testing only endpoint")
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

mongoose.connect(config.db.uri, { useNewUrlParser: true }).then(async () => {
    const user = await User.findOne() //dummy user, future implementation
    if (!user) {
        const user = new User({
            email: 'matteobrogin@test.com',
            password: 'im-blue-da-ba-de',
            queue: []
        })
        await user.save()
    }
    app.listen(config.app.port, config.app.hostname, () => {
        console.log(`Listening on port ${config.app.port}, current host ${config.app.hostname}`)
    })
})