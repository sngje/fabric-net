'use strict';

// Function to return errors
function getErrorMessage(field) {
    let response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

module.exports = getErrorMessage;