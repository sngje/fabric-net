const express = require('express');
const bodyParser = require('body-parser');
const { request } = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/api', require('./routes/api'));


app.listen(3000, ()=>{
    console.log('***********************************');
    console.log('API server listening at http://localhost:3000');
    console.log('example 1 (get): http://localhost:3000/api/queryallcages');
    console.log('example 2 (get): http://localhost:3000/api/query/Cage0');
    console.log('example 3 (put): http://localhost:3000/api/changeage/Cage0');
    console.log('example 4 (post): http://localhost:3000/api/addcage');
    console.log('example 5 (get): http://localhost:3000/api/history/Cage0');
    console.log('example 6 (get): http://localhost:3000/api/injection');
    console.log('example 7 (put): http://localhost:3000/api/inject/Cage0');
    console.log('***********************************');
});