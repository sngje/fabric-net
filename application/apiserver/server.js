'use strict';

let express = require('express');
let bodyParser = require('body-parser');
let app = express();
const fabricNetwork = require('./fabricNetwork');
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


app.get('/api/queryallcages', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Evaluate the specified transaction.
        // queryAllCages transaction - requires no arguments, ex: ('queryAllCages')
        const result = await contract.evaluateTransaction('queryAllCages');
        console.log('Transaction has been evaluated');
        console.log(JSON.parse(result));
        res.status(200).json(JSON.parse(result));

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});

app.get('/api/query/:cage_id', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Evaluate the specified transaction.
        // queryCage transaction - requires 1 argument, ex: ('queryCage', 'Cage1')
        const result = await contract.evaluateTransaction('queryCage', req.params.cage_id);
        console.log('Transaction has been evaluated');
        console.log(JSON.parse(result));
        res.status(200).json(JSON.parse(result));

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});

app.get('/api/history/:cage_id', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Evaluate the specified transaction.
        // queryCage transaction - requires 1 argument, ex: ('queryCage', 'Cage1')
        const result = await contract.evaluateTransaction('getHistory', req.params.cage_id);
        console.log('Transaction has been evaluated');
        console.log(JSON.parse(result));
        res.status(200).json(JSON.parse(result));

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});

app.post('/api/addcage/', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Submit the specified transaction.
        let tx = await contract.submitTransaction('createCage', req.body.id, req.body.vaccination, req.body.age);
        console.log('Transaction has been submitted');
        res.status(200).json({
            status: '200 - transaction has been submitted',
            transaction_id: tx.toString()
        });

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});

app.put('/api/changeage/:cage_id', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Evaluate the specified transaction.
        // queryCage transaction - requires 1 argument, ex: ('queryCage', 'Cage1')
        let tx = await contract.submitTransaction('changeCageAge', req.params.cage_id, req.body.age);
        console.log('Transaction has been evaluated');
        res.status(200).json({
            status: '200 - transaction has been submitted',
            transaction_id: tx.toString()
        });
        // console.log(JSON.parse(query_result));
        // res.send('Transaction has been submitted');

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: error});
        process.exit(1);
    }
});

app.listen(3000, ()=>{
    console.log('***********************************');
    console.log('API server listening at http://localhost:3000');
    console.log('example 1: http://localhost:3000/api/queryallcages');
    console.log('example 2: http://localhost:3000/api/query/Cage0');
    console.log('example 3: http://localhost:3000/api/history/Cage0');
    console.log('***********************************');
});