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
    queue: [
        {
            songId: {
                type: Schema.Types.ObjectId,
                ref: 'Song',
                required: true
            }
        }
    ]
})

userSchema.methods.addToQueue = function (song) {
    this.queue.push({ songId: song._id })
    return this.save()
}

userSchema.methods.getNextSongFromQueue = async function () {
    this.queue = this.queue.filter(song => song.songId != null) //rimuovo eventuali canzoni expirate
    let nextSong = this.queue.shift()
    if (nextSong) nextSong = nextSong.songId
    await this.save()
    return nextSong
}
/*
userSchema.methods.removeFromCart = function (productId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString()
    })
    this.cart.items = updatedCartItems
    return this.save()
}

userSchema.methods.clearCart = function () {
    this.cart = { items: [] }
    return this.save()
}*/

module.exports = mongoose.model('User', userSchema)