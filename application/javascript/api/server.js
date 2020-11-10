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
    secret: APP_SECRET
}).unless({
    path: ['/api/register','/api/login']
}));

// Error handling for 401 status
app.use(function(err, req, res, next) {
    if(err.name === 'UnauthorizedError') {
      res.status(err.status).send({message:err.message});
      logger.error({message:err.message});
      return;
    }
 next();
});

// Use Bearer token and set logger level to debug
app.use(bearerToken());
logger.level = 'debug';

// Authorized routes without token
app.use((req, res, next) => {
    logger.debug('New req for %s', req.originalUrl);
    if (req.originalUrl.indexOf('/api/register') >= 0 || req.originalUrl.indexOf('/api/login') >= 0) {
        return next();
    }
    let token = req.token;
    jwt.verify(token, app.get('secret'), (err, decoded) => {
        if (err) {
            console.log(`Error ================: ${err}`);
            // res.status(401).send('Unauthorized user');
            // console.log(res);
            res.send({
                success: false,
                message: 'Failed to authenticate token. Make sure to include the ' +
                    'token returned from /users call in the authorization header ' +
                    ' as a Bearer token'
            });
            return;
        } else {
            req.username = decoded.username;
            req.orgname = decoded.orgname;
            logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgname));
            return next();
        }
    });
});

// Loading defined routes
app.use('/api', require('./config/routes'));

// Start the app
app.listen(PORT, ()=>{
    console.log('***********************************');
    console.log('API server listening at http://localhost:%s', PORT);
    console.log('example 1 (get): http://localhost:%s/api/queryallcages/0', PORT);
    console.log('example 2 (get): http://localhost:%s/api/query/Cage0', PORT);
    console.log('example 3 (put): http://localhost:%s/api/changeage/Cage0', PORT);
    console.log('example 4 (post): http://localhost:%s/api/addcage', PORT);
    console.log('example 5 (get): http://localhost:%s/api/history/Cage0', PORT);
    console.log('example 6 (get): http://localhost:%s/api/injection', PORT);
    console.log('example 7 (put): http://localhost:%s/api/inject/Cage0', PORT);
    console.log('***********************************');
});