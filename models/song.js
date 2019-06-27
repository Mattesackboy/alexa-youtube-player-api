'use strict'

const mongoose = require('mongoose'), Schema = mongoose.Schema

const songSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    artist: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    ytId: {
        type: String,
        required: true,
        unique: true
    },
    thumbnail: String,
    expireAt: {
        type: Date,
        required: true,
        default: () => {
            // 18000 seconds from now
            const millis = 18000 * 1000
            return new Date(new Date().valueOf() + millis)
        }
    }
})

songSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

songSchema.methods.getSongInfo = function() {
    console.log(this.title)
    return {
        title: this.title,
        artist: this.artist,
        url: this.url,
        thumbnail: this.thumbnail
    }
}

module.exports = mongoose.model('Song', songSchema)