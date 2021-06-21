'use strict';
const jwt_decode = require('jwt-decode');

// Function to return errors
function getErrorMessage(field) {
    let response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

function decodeJwt(token) {
    // const filter_token = token.substring(7, token.lengh);
    // console.log(filter_token);
    let decoded = jwt_decode(token);
    return decoded;
}

function generateRandomId(length = 8) {
    // Declare all characters
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Pick characers randomly
    let str = '';
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;

};


module.exports = {
<<<<<<< HEAD
    decode_jwt: decode_jwt,
    getErrorMessage: getErrorMessage,
    generateRandomId: generateRandomId,
=======
    decodeJwt: decodeJwt,
    getErrorMessage: getErrorMessage,
>>>>>>> e7df4b99d7d00f6280945c9494709a3bdb7193dd
}