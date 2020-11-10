const express = require('express');
const fabricNetwork = require('./fabricNetwork');
const log4js = require('log4js');
const logger = log4js.getLogger('FabricNetworkApplication');
const jwt = require('jsonwebtoken');
const helper = require('./helper');
const router = express.Router();
const constants = require('./constants.json');

// Register and enroll user
router.post('/register', async function (req, res) {
    let username = req.body.username;
    let orgname = req.body.orgname;
    logger.debug('End point : /users');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgname);
    if (!username) {
        res.json(helper('\'username\''));
        return;
    }
    if (!orgname) {
        res.json(helper('\'orgname\''));
        return;
    }

    let isUserRegistered = await fabricNetwork.isUserRegistered(username, orgname);

    if (isUserRegistered) {
        res.json({ success: false, message: `Username ${username} is already registred. Pick another one.` });
        return;
    }

    let token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
        username: username,
        orgname: orgname
    }, req.app.get('secret'));

    logger.debug('Token: ' + token);

    let response = await fabricNetwork.getRegisteredUser(username, orgname);

    logger.debug('-- returned from registering the username %s for organization %s', username, orgname);
    if (response && typeof response !== 'string') {
        logger.debug('Successfully registered the username %s for organization %s', username, orgname);
        response.token = token;
        res.json(response);
    } else {
        logger.debug('Failed to register the username %s for organization %s with::%s', username, orgname, response);
        res.json({ success: false, message: response });
    }

});

// Login and get jwt
router.post('/login', async function (req, res) {
    let username = req.body.username;
    let orgname = req.body.orgname;
    logger.debug('End point : /users');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgname);

    if (!username) {
        res.json(helper.getErrorMessage('\'username\''));
        return;
    }
    if (!orgname) {
        res.json(helper.getErrorMessage('\'orgname\''));
        return;
    }

    let isUserRegistered = await fabricNetwork.isUserRegistered(username, orgname);

    if (isUserRegistered) {
        let token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
            username: username,
            orgname: orgname
        }, req.app.get('secret'));
        res.json({ success: true, message: { token: token } });
    } else {
        res.json({ success: false, message: `User with username ${username} is not registered with ${orgname}, Please register first.` });
    }
});

// Query all data 
router.get('/queryallcages/:bookmark', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Evaluate the specified transaction.
        // queryAllCages transaction - requires no arguments, ex: ('queryAllCages')
        let queryString = {
            selector: {
                docType: 'duck'
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        console.log(JSON.parse(result));
        res.status(200).json(JSON.parse(result));

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Query for individual data
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

// Query for history for individual data
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

// Query to get uninjected data
router.get('/injection/:bookmark', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // let condition = false;
        // const result = await contract.evaluateTransaction('queryWithVaccination', condition);
        // let objects = JSON.parse(result);

        let queryString = {
            selector: {
                vaccination: false
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
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

// Search query with different parameters
router.get('/search/:bookmark', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // let condition = false;
        // const result = await contract.evaluateTransaction('queryWithVaccination', condition);
        // let objects = JSON.parse(result);

        const age = parseInt(req.body.age);
        const condition = (req.body.vaccination === 'on') ? true : false;
        let queryString = {
            selector: {
                age: age,
                vaccination: condition
            }
        };
        console.log(queryString);
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        let objects = JSON.parse(result);
       
        // check what we have
        if (objects.length === 0) {
            throw new Error('Any data found for the parameter');
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

// Transaction - inject data
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

// Adding new data
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

// Transaction to change age
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

// Transaction to delete
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

// Prosessing plant steps
router.put('/processing_plant/:cage_id', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Evaluate the specified transaction.
        // queryCage transaction - requires 1 argument, ex: ('queryCage', 'Cage1')
        let tx = await contract.submitTransaction('processingPlant', req.params.cage_id, req.body.acceptable, req.body.deliverer);
        let data = await contract.evaluateTransaction('queryCage', req.params.cage_id);
        let answer = JSON.parse(data);
        answer.tx_id = tx.toString();
        console.log('Transaction has been evaluated');
        res.status(200).json(answer);
        // console.log(JSON.parse(query_result));
        // res.send('Transaction has been submitted');

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Edit data
router.put('/edit/:cage_id', async function (req, res) {
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork();

        // Evaluate the specified transaction.
        // queryCage transaction - requires 1 argument, ex: ('queryCage', 'Cage1')
        let tx = await contract.submitTransaction('editAsset', req.params.cage_id, req.body.age, req.body.vaccination, req.body.step);
        let data = await contract.evaluateTransaction('queryCage', req.params.cage_id);
        let answer = JSON.parse(data);
        answer.tx_id = tx.toString();
        console.log('Transaction has been evaluated');
        res.status(200).json(answer);
        
        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

module.exports = router;