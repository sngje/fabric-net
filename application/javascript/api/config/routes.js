const express = require('express');
const fabricNetwork = require('./fabricNetwork');
const log4js = require('log4js');
const logger = log4js.getLogger('FabricNetwork');
const jwt = require('jsonwebtoken');
const router = express.Router();
const constants = require('./constants.json');

// Function to return errors
function getErrorMessage(field) {
    let response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

// Register and enroll user
router.post('/users', async function (req, res) {
    let username = req.body.username;
    let orgName = req.body.orgName;
    logger.debug('End point : /users');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);
    if (!username) {
        res.json(getErrorMessage('\'username\''));
        return;
    }
    if (!orgName) {
        res.json(getErrorMessage('\'orgName\''));
        return;
    }

    let token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
        username: username,
        orgName: orgName
    }, req.app.get('secret'));

    logger.debug('Token: ' + token);

    let response = await fabricNetwork.getRegisteredUser(username, orgName, true);

    logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
    if (response && typeof response !== 'string') {
        logger.debug('Successfully registered the username %s for organization %s', username, orgName);
        response.token = token;
        res.json(response);
    } else {
        logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
        res.json({ success: false, message: response });
    }

});

// Login and get jwt
router.post('/users/login', async function (req, res) {
    var username = req.body.username;
    var orgName = req.body.orgName;
    logger.debug('End point : /users');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);
    if (!username) {
        res.json(getErrorMessage('\'username\''));
        return;
    }
    if (!orgName) {
        res.json(getErrorMessage('\'orgName\''));
        return;
    }

    var token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
        username: username,
        orgName: orgName
    }, req.app.get('secret'));

    let isUserRegistered = await fabricNetwork.isUserRegistered(username, orgName);

    if (isUserRegistered) {
        res.json({ success: true, message: { token: token } });

    } else {
        res.json({ success: false, message: `User with username ${username} is not registered with ${orgName}, Please register first.` });
    }
});

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