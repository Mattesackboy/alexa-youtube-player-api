'use strict'

const mongoose = require('mongoose'), Schema = mongoose.Schema

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    currentQueue: {
        nextSong: { //canzone che deve essere presa
            type: Schema.Types.ObjectId,
            ref: 'Song'
        },
        willPlay: { //canzone già presa, ma non ancora riprodotta
            type: Schema.Types.ObjectId,
            ref: 'Song'
        },
        queue: [
            {
                songId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Song',
                    required: true
                }
            }
        ]
    }
})

const cleanQueue = (currentQueue) => {
    const cleanedQueue = currentQueue.queue.filter(song => song.songId != null) //rimuovo eventuali canzoni expirate
    currentQueue.nextSong = !currentQueue.nextSong ? (cleanedQueue.shift() || {}).songId : currentQueue.nextSong
    currentQueue.queue = cleanedQueue
    return currentQueue
}

userSchema.methods.addToQueue = function (song) {
    this.currentQueue = cleanQueue(this.currentQueue)
    if (!this.currentQueue.nextSong) this.currentQueue.nextSong = song._id
    else this.currentQueue.queue.push({ songId: song._id })
    return this.save()
}

userSchema.methods.getCurrentQueue = async function () {
    this.currentQueue = cleanQueue(this.currentQueue)
    await this.save()
    if (!this.currentQueue.nextSong) return this.currentQueue
    this.currentQueue.queue.unshift({
        songId: this.currentQueue.nextSong
    })
    return this.currentQueue
}

/**
 * Se shouldChangeQueue è `true` allora nextSong verrà sostituita con la prossima canzone in coda (default value è `true`)
 */
userSchema.methods.getNextSong = async function (shouldChangeQueue = true) {
    this.currentQueue = cleanQueue(this.currentQueue)
    if (!this.currentQueue.nextSong && this.currentQueue.queue.length != 0) throw new Error("nextSong is empty but we have songs in the queue")
    //next song potrebbe essere undefined
    const nextSong = this.currentQueue.nextSong
    if (shouldChangeQueue) {
        this.currentQueue.nextSong = (this.currentQueue.queue.shift() || {}).songId
        this.currentQueue.willPlay = nextSong
    }
    await this.save()
    return nextSong ? {
        title: nextSong.title,
        artist: nextSong.artist,
        url: nextSong.url,
        thumbnail: nextSong.thumbnail
    } : undefined
}

userSchema.methods.getWillPlaySong = function () {
    return this.currentQueue.willPlay ? {
        title: this.currentQueue.willPlay.title,
        artist: this.currentQueue.willPlay.artist,
        url: this.currentQueue.willPlay.url,
        thumbnail: this.currentQueue.willPlay.thumbnail
    } : undefined
}

/*userSchema.methods.getNextSongFromQueue = async function (requireNextSong = false) {
    this.queue = this.queue.filter(song => song.songId != null) //rimuovo eventuali canzoni expirate
    let nextSong = this.queue.shift()
    if (nextSong) nextSong = nextSong.songId
    this.nextSong = nextSong
    await this.save()
    return nextSong
}*/

module.exports = mongoose.model('User', userSchema)