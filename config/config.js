'use strict'

require('dotenv').config()

const env = process.env.NODE_ENV // 'development' or 'production'

const development = {
    app: {
        hostname: process.env.DEV_HOSTNAME || '0.0.0.0',
        port: parseInt(process.env.DEV_APP_PORT) || 3001,
        youtubeAPIKey: process.env.DEV_YT_API_KEY, //Get this from: https://console.developers.google.com/apis/credentials/key,
        maxSongDurationInSeconds: parseInt(process.env.DEV_SONG_DURATION) || 380
    },
    db: {
        uri: process.env.DEV_MONGODB_URI
    }
}
const production = {
    app: {
        hostname: process.env.PROD_HOSTNAME || '0.0.0.0',
        port: parseInt(process.env.PROD_APP_PORT) || 3001,
        youtubeAPIKey: process.env.PROD_YT_API_KEY, //Get this from: https://console.developers.google.com/apis/credentials/key
        maxSongDurationInSeconds: parseInt(process.env.PROD_SONG_DURATION) || 380
    },
    db: {
        uri: process.env.PROD_MONGODB_URI
    }
}

const config = {
    development,
    production
}

module.exports = config[env] || development