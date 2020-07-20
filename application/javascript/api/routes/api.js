const express = require('express');
const fabricNetwork = require('./fabricNetwork');

const router = express.Router();

router.get('/queryallcages', async function (req, res) {
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
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

router.get('/query/:cage_id', async function (req, res) {
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
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

router.get('/history/:cage_id', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Evaluate the specified transaction.
        // queryCage transaction - requires 1 argument, ex: ('queryCage', 'Cage1')
        const result = await contract.evaluateTransaction('getFullHistory', req.params.cage_id);
        console.log('Transaction has been evaluated');
        console.log(JSON.parse(result));
        res.status(200).json(JSON.parse(result));

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

router.get('/injection', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        let condition = false;
        const result = await contract.evaluateTransaction('queryWithVaccination', condition);
        let objects = JSON.parse(result);

        // check what we have
        if (objects.length === 0) {
            throw new Error('All cages are injected');
        }

        console.log(objects);
        res.status(200).json(objects);

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

router.put('/inject/:cage_id', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // let condition = false;
        // const result = await contract.evaluateTransaction('queryCage', req.params.cage_id);
        // let objects = JSON.parse(result);

        // // check what we have
        // if (objects.length === 0) {
        //     throw new Error('Cage not found');
        // }

        // iterate objects to obtain key values
        // then update vaccination condition, then submit transaction to the ledger
        let tx = await contract.submitTransaction('changeCondition', req.params.cage_id, true);
        console.log(`OK - ${tx}`);
        res.status(200).json({
            response: 'Successfully injected',
            tx_id: tx.toString()
        });

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});


router.post('/addcage/', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Submit the specified transaction.
        let tx = await contract.submitTransaction('createCage', req.body.id, req.body.vaccination, req.body.age);
        console.log('Transaction has been submitted');
        res.status(200).json({
            response: 'Successfully added',
            tx_id: tx.toString()
        });

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({error: 'Transaction failed ( Please try again.'}); 
    }
});

router.put('/changeage/:cage_id', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Evaluate the specified transaction.
        // queryCage transaction - requires 1 argument, ex: ('queryCage', 'Cage1')
        let tx = await contract.submitTransaction('changeCageAge', req.params.cage_id);
        console.log('Transaction has been evaluated');
        res.status(200).json({
            response: 'Age successfully increased',
            tx_id: tx.toString()
        });
        // console.log(JSON.parse(query_result));
        // res.send('Transaction has been submitted');

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

router.delete('/delete/:cage_id', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Evaluate the specified transaction.
        // queryCage transaction - requires 1 argument, ex: ('queryCage', 'Cage1')
        let tx = await contract.submitTransaction('deleteCage', req.params.cage_id);
        console.log('Transaction has been evaluated');
        res.status(200).json({
            response: 'Cage successfully deleted',
            tx_id: tx.toString()
        });
        // console.log(JSON.parse(query_result));
        // res.send('Transaction has been submitted');

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

//process.exit(1);

module.exports = router;