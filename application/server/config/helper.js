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

module.exports = {
    decodeJwt: decodeJwt,
    getErrorMessage: getErrorMessage,
}