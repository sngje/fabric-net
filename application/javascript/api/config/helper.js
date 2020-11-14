'use strict';
const jwt_decode = require('jwt-decode');


// Function to return errors
async function getErrorMessage(field) {
    let response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}
async function decode_jwt(token) {
    let decoded = jwt_decode(token);
    return decoded;
}

module.exports = {
    decode_jwt: decode_jwt,
    getErrorMessage: getErrorMessage
}