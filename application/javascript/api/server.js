const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const log4js = require('log4js');
const logger = log4js.getLogger('FabricNetwork');
const expressJWT = require('express-jwt');
const jwt = require('jsonwebtoken');
const bearerToken = require('express-bearer-token');
const cors = require('cors');
const util = require('util')

app.options('*', cors());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
// set secret variable
app.set('secret', 'thisismysecret');
app.use(expressJWT({
    secret: 'thisismysecret'
}).unless({
    path: ['/users','/users/login']
}));
app.use(bearerToken());

logger.level = 'debug';

// app.set('view engine', 'ejs');
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({
//     extended: false
// }));
// // set secret variable
// app.set('secret', 'thisismysecret');
// app.use(bearerToken());

// logger.level = 'debug';

app.use((req, res, next) => {
    logger.debug('New req for %s', req.originalUrl);
    if (req.originalUrl.indexOf('/users') >= 0 || req.originalUrl.indexOf('/users/login') >= 0) {
        return next();
    }
    var token = req.token;
    jwt.verify(token, app.get('secret'), (err, decoded) => {
        if (err) {
            console.log(`Error ================: ${err}`)
            res.send({
                success: false,
                message: 'Failed to authenticate token. Make sure to include the ' +
                    'token returned from /users call in the authorization header ' +
                    ' as a Bearer token'
            });
            return;
        } else {
            req.username = decoded.username;
            req.orgname = decoded.orgName;
            logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
            return next();
        }
    });
});

app.use('/api', require('./config/routes'));


app.listen(3000, ()=>{
    console.log('***********************************');
    console.log('API server listening at http://localhost:3000');
    console.log('example 1 (get): http://localhost:3000/api/queryallcages/0');
    console.log('example 2 (get): http://localhost:3000/api/query/Cage0');
    console.log('example 3 (put): http://localhost:3000/api/changeage/Cage0');
    console.log('example 4 (post): http://localhost:3000/api/addcage');
    console.log('example 5 (get): http://localhost:3000/api/history/Cage0');
    console.log('example 6 (get): http://localhost:3000/api/injection');
    console.log('example 7 (put): http://localhost:3000/api/inject/Cage0');
    console.log('***********************************');
});