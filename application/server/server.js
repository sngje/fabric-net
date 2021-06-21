const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');
const app = express();
const log4js = require('log4js');
const logger = log4js.getLogger('FabricNetwork');
const expressJWT = require('express-jwt');
const jwt = require('jsonwebtoken');
const bearerToken = require('express-bearer-token');
const cors = require('cors');
const util = require('util');

function logOriginalUrl (req, res, next) {
    logger.debug('Request URL:', req.originalUrl);
    next();
}
  
function logMethod (req, res, next) {
    logger.debug('Request Type:', req.method);
    next();
}

// Loading env variables
const APP_SECRET = process.env.APP_SECRET;
const PORT = process.env.PORT;

// Basic setup for API service
app.options('*', cors());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

// Set secret variable
app.set('secret', APP_SECRET);

// Set tokenized authorization
app.use(expressJWT({
    secret: APP_SECRET,
    algorithms: ['HS256']
}).unless({
    path: ['/api/users/register','/api/users/login']
}));


// Error handling for errors status
app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(err.status).send({message:err.message});
        logger.error({
            success: false,
            message:err.message
        });
        return;
    }
    logger.error(err.stack);
    next();
});

// Use Bearer token and set logger level to debug
app.use(bearerToken());
logger.level = 'debug';

// Authorized routes without token
app.use((req, res, next) => {
    // logger.debug('New req for %s', req.originalUrl);
    if (req.originalUrl.indexOf('/api/users/register') >= 0 || req.originalUrl.indexOf('/api/users/login') >= 0) {
        return next();
    }
    let token = req.token;
    // console.log(req);
    jwt.verify(token, app.get('secret'), (err, decoded) => {
        if (err) {
            logger.error(`Error ================: ${err}`);
            // res.stajwt tokentus(401).send('Unauthorized user');
            // console.log(res);
            res.send({
                success: false,
                message: 'Failed to authenticate token. Make sure to include the ' +
                    'token returned from /users call in the authorization header ' +
                    ' as a Bearer token'
            });
            return;
        } else {
            req.email = decoded.email;
            req.orgname = decoded.orgname;
            logger.debug(util.format('Decoded from JWT token: email - %s, orgname - %s', decoded.email, decoded.orgname));
            return next();
        }
    });
});

// Loading defined routes
var logStuff = [logOriginalUrl, logMethod]
app.use('/api', logStuff, require('./config/routes'));

// Start the app
app.listen(PORT, ()=>{
    console.log('***********************************');
    console.log('API server listening at http://localhost:%s', PORT);
    console.log('example 1 (get): http://localhost:%s/api/assets/all/0', PORT);
    console.log('example 2 (get): http://localhost:%s/api/assets/Cage0', PORT);
    console.log('example 3 (put): http://localhost:%s/api/assets/Cage0/update/age', PORT);
    console.log('example 4 (put): http://localhost:%s/api/assets/Cage0/update/vaccination', PORT);
    console.log('example 5 (post): http://localhost:%s/api/assets/create', PORT);
    console.log('example 6 (get): http://localhost:%s/api/assets/Cage/history', PORT);
    console.log('example 7 (get): http://localhost:%s/api/assets/filter/prosessing-plant/all', PORT);
    console.log('example 8 (get): http://localhost:%s/api/assets/filter/prosessing-plant/finished', PORT);
    console.log('example 9 (get): http://localhost:%s/api/assets/filter/health-monitor', PORT);
    console.log('example 10 (get): http://localhost:%s/api/assets/search/0', PORT);
    console.log('example 11 (get): http://localhost:%s/api/users/register', PORT);
    console.log('example 12 (get): http://localhost:%s/api/users/login', PORT);
    console.log('***********************************');
});