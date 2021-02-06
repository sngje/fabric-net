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
        res.json(helper.getErrorMessage('\'username\''));
        return;
    }
    if (!orgname) {
        res.json(helper.getErrorMessage('\'orgname\''));
        return;
    }

    // Check to see if the username is taken or not
    let isUserRegistered = await fabricNetwork.isUserRegistered(username, orgname);

    if (isUserRegistered) {
        res.json({
            success: false,
            message: `Username ${username} is already registred. Pick another one.`
        });
        return;
    }

    // // Generate token
    // let token = jwt.sign({
    //     exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
    //     username: username,
    //     orgname: orgname
    // }, req.app.get('secret'));

    // // Output token on console
    // logger.debug('Token: ' + token);

    // request to fabric to enroll
    let response = await fabricNetwork.getRegisteredUser(username, orgname);

    logger.debug('-- returned from registering the username %s for organization %s', username, orgname);
    if (response && typeof response !== 'string') {
        logger.debug('Successfully registered the username %s for organization %s', username, orgname);
        // response.token = token;
        console.log(response);
        res.status(200).json(response);
    } else {
        logger.error('Failed to register the username %s for organization %s with::%s', username, orgname, response);
        res.status(200).json({
            success: false,
            message: response
        });
    }

});

// Login and get jwt
router.post('/login', async function (req, res) {
    logger.debug('End point : /login');
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
        res.status(200).json({ 
            success: true,
            message: `${username} successfully logged in`,
            token: token
        });
    } else {
        res.status(200).json({
            success: false,
            message: `User with username ${username} is not registered with ${orgname}, Please register first.`
        });
    }
});

// Query all data 
router.get('/queryallassets/:bookmark', async function (req, res) {
    logger.debug('End point : /queryallcages');
    // console.log(req.headers['authorization']);
    const decoded = helper.decode_jwt(req.headers['authorization']);
    // console.log(decoded);
    
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

        // Evaluate the specified transaction.
        // queryAllCages transaction - requires no arguments, ex: ('queryAllCages')
        let queryString = {
            selector: {
                docType: 'duck'
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryWithPagination',JSON.stringify(queryString), 10,bookmark);
        logger.debug('Response : ok');
        res.status(200).json(JSON.parse(result));

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        logger.error('Failed to evaluate transaction: ' + error);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Query for individual data
router.get('/get-asset/:cage_id', async function (req, res) {
    logger.debug('End point : /queryallcages');
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        const result = await contract.evaluateTransaction('getAsset', req.params.cage_id);
        logger.debug('Transaction has been evaluated');
        logger.debug('Result : ' + JSON.parse(result));
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
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
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
router.get('/show-uninjected-assets/:bookmark', async function (req, res) {
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

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

// Query to get processing plant data
router.get('/processing-plant/all/:bookmark', async function (req, res) {
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

        let queryString = {
            selector: {
                step: {"$gt": 1}
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        let objects = JSON.parse(result);
       
        // check what we have
        if (objects.length === 0) {
            throw new Error('Nothing found');
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

// Query to get finished processing plant data
router.get('/processing-plant/finished/:bookmark', async function (req, res) {
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

        let queryString = {
            selector: {
                step: {"$eq": 6}
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        let objects = JSON.parse(result);
       
        // check what we have
        if (objects.length === 0) {
            throw new Error('Nothing found');
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
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

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
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

        // let condition = false;
        // const result = await contract.evaluateTransaction('getAsset', req.params.cage_id);
        // let objects = JSON.parse(result);

        // // check what we have
        // if (objects.length === 0) {
        //     throw new Error('Cage not found');
        // }

        // iterate objects to obtain key values
        // then update vaccination condition, then submit transaction to the ledger
        let tx = await contract.submitTransaction('updateAssetInjectionStatus', req.params.cage_id, true);
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
router.post('/create-asset/', async function (req, res) {
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

        // Submit the specified transaction.
        let tx = await contract.submitTransaction('createAsset', req.body.id, req.body.vaccination, req.body.age);
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
router.put('/update-asset-age/:cage_id', async function (req, res) {
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        let tx = await contract.submitTransaction('updateAssetAge', req.params.cage_id, req.body.new_age);
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
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        let tx = await contract.submitTransaction('deleteAsset', req.params.cage_id);
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
router.put('/processing-plant/:cage_id', async function (req, res) {
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        let tx = await contract.submitTransaction('upgradeAssetToProsessingPlant', req.params.cage_id, req.body.acceptable, req.body.deliverer);
        let data = await contract.evaluateTransaction('getAsset', req.params.cage_id);
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
router.put('/update-asset/:cage_id', async function (req, res) {
    const decoded = helper.decode_jwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['username'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        let tx = await contract.submitTransaction('updateAsset', req.params.cage_id, req.body.age, req.body.vaccination, req.body.step);
        let data = await contract.evaluateTransaction('getAsset', req.params.cage_id);
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