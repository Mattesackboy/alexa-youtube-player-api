'use strict'

module.exports = class Response {
    /**
     * Default constructor
     * @param {String} result or 'success' or 'error'
     * @param {String} message Message to send
     * @param {any} data Any additional Data
     */
    constructor(result, message, data = undefined) {
        result = result.toLowerCase()
        const check = result === 'success' || result === 'error' 
        this.result = check ? result : 'error'
        this.message = message
        this.data = data
    }
}