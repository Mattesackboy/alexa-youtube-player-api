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
            // 120 seconds from now
            const millis = 18000 * 1000
            return new Date(new Date().valueOf() + millis);
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

/*userSchema.methods.addToCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString()
    })
    let newQuantity = 1
    const updatedCartItems = [...this.cart.items]

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1
        updatedCartItems[cartProductIndex].quantity = newQuantity
    } else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity
        })
    }
    const updatedCart = {
        items: updatedCartItems
    }
    this.cart = updatedCart
    return this.save()
}

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

module.exports = mongoose.model('Song', songSchema)