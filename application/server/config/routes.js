const express = require('express');
const fabricNetwork = require('./fabricNetwork');
const log4js = require('log4js');
const logger = log4js.getLogger('FabricNetworkApplication');
const jwt = require('jsonwebtoken');
const helper = require('./helper');
const router = express.Router();
const constants = require('./constants.json');

// Register and enroll user
router.post('/users/register', async function (req, res) {
    let email = req.body.email;
    let orgname = req.body.orgname;
    logger.debug('User email : ' + email);
    logger.debug('Org name  : ' + orgname);
    if (!email) {
        res.json(helper.getErrorMessage('\'email\''));
        return;
    }
    if (!orgname) {
        res.json(helper.getErrorMessage('\'orgname\''));
        return;
    }

    // Check to see if the email is taken or not
    let isUserRegistered = await fabricNetwork.isUserRegistered(email, orgname);

    if (isUserRegistered) {
        res.json({
            success: false,
            message: `Email ${email} is already registred. Pick another one.`
        });
        return;
    }
    
    // request to fabric to enroll
    let response = await fabricNetwork.getRegisteredUser(email, orgname);

    logger.debug('-- returned from registering the email %s for organization %s', email, orgname);
    if (response && typeof response !== 'string') {
        logger.debug('Successfully registered the email %s for organization %s', email, orgname);
        // response.token = token;
        logger.info(response);
        res.status(200).json(response);
    } else {
        logger.error('Failed to register the email %s for organization %s with::%s', email, orgname, response);
        res.status(200).json({
            success: false,
            message: response
        });
    }

});

// Login and get jwt
router.post('/users/login', async function (req, res) {
    logger.debug('End point : /login');
    let email = req.body.email;
    let orgname = req.body.orgname;
    logger.debug('User name : ' + email);
    logger.debug('Org name  : ' + orgname);

    if (!email) {
        res.json(helper.getErrorMessage('\'email\''));
        return;
    }
    if (!orgname) {
        res.json(helper.getErrorMessage('\'orgname\''));
        return;
    }

    let isUserRegistered = await fabricNetwork.isUserRegistered(email, orgname);

    if (isUserRegistered) {
        let token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + parseInt(constants.jwt_expiretime),
            email: email,
            orgname: orgname
        }, req.app.get('secret'));
        res.status(200).json({ 
            success: true,
            message: `${email} successfully logged in`,
            token: token
        });
    } else {
        res.status(200).json({
            success: false,
            message: `User with email ${email} is not registered with ${orgname}, Please register first.`
        });
    }
});

// Adding new data
router.post('/assets/create', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);
        const product_id = helper.generateRandomId(10);
        
        // Default values to pass
        const current_date = new Date();
        const current_time = current_date.toISOString();
        console.log(`${product_id} ${current_time}`);

        // result = await contract.evaluateTransaction('org.hyperledger.fabric:GetMetadata');
        // console.log(JSON.parse(result.toString('utf8')));

        // Submit the specified transaction.
        let tx = await contract.submitTransaction('createAsset', product_id, current_time, req.body.quantity, req.body.product_serial, req.body.message);
        console.log('Transaction has been submitted');
        res.status(200).json({
            response: `Successfully added - ${product_id}`,
            tx_id: tx.toString()
        });

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({error: 'Transaction failed ( Please try again.'}); 
    }
});


// Transaction to delete
router.delete('/assets/:id/delete', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        let tx = await contract.submitTransaction('deleteAsset', req.params.id);
        logger.info('Transaction has been evaluated');
        res.status(200).json({
            response: 'Cage successfully deleted',
            tx_id: tx.toString()
        });

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Edit data
router.put('/assets/:id/edit', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        let tx = await contract.submitTransaction('updateAsset', req.params.id, req.body.age, req.body.vaccination, req.body.step);
        let data = await contract.evaluateTransaction('getAsset', req.params.id);
        let answer = JSON.parse(data);
        answer.tx_id = tx.toString();
        logger.debug('Transaction has been evaluated');
        res.status(200).json(answer);
        
        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Query for individual data
router.get('/assets/:id', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        const result = await contract.evaluateTransaction('getAsset', req.params.id);
        logger.debug('Transaction has been evaluated');
        logger.debug('Result : ' + JSON.parse(result));
        res.status(200).json(JSON.parse(result));

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Query all data 
router.get('/assets/all/:bookmark', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    // logger.info(decoded);

    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        // Evaluate the specified transaction.
        // queryallassets transaction - requires no arguments, ex: ('queryallassets')
        const queryString = {
            selector: {
                docType: 'duck',
                step: {"$eq": 1}
            } 
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryAssetsWithPagination',JSON.stringify(queryString), 10,bookmark);
        logger.debug('Response : ok');
        res.status(200).json(JSON.parse(result));

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error('Failed to evaluate transaction: ' + error);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Query for history for individual data
router.get('/assets/:id/history', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        const result = await contract.evaluateTransaction('getAssetHistory', req.params.id);
        logger.info('Transaction has been evaluated');
        logger.info(JSON.parse(result));
        res.status(200).json(JSON.parse(result));

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Query to get uninjected data
router.get('/assets/filter/health-monitor/:bookmark', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        // let condition = false;
        // const result = await contract.evaluateTransaction('queryWithVaccination', condition);
        // let objects = JSON.parse(result);

        let queryString = {
            selector: {
                vaccination: false
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryAssetsWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        let objects = JSON.parse(result);
       
        // check what we have
        if (objects.length === 0) {
            throw new Error('All cages are injected');
        }

        logger.info(objects);
        res.status(200).json(objects);

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Search query with different parameters
router.get('/assets/search/:bookmark', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

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
        logger.info(queryString);
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryAssetsWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        let objects = JSON.parse(result);
       
        // check what we have
        if (objects.length === 0) {
            throw new Error('Any data found for the parameter');
        }

        logger.info(objects);
        res.status(200).json(objects);

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Transaction - inject data
router.put('/assets/:id/update/vaccination', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        let tx = await contract.submitTransaction('updateAssetInjectionStatus', req.params.id);
        logger.info(`OK - ${tx}`);
        res.status(200).json({
            response: 'Successfully injected',
            tx_id: tx.toString()
        });

        // disconnect the gateway
        await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});


// Transaction to change age
router.put('/assets/:id/update/age', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        let tx = await contract.submitTransaction('updateAssetAge', req.params.id);
        logger.info('Transaction has been evaluated');
        res.status(200).json({
            response: 'Age successfully increased',
            tx_id: tx.toString()
        });
        
        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Query to get finished processing plant data
router.get('/processing-plant/assets/confirmation/:bookmark', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        let queryString = {
            selector: {
                step: {"$eq": 2},
                processing_plant: {
                    status: 'PENDING'
                }
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryAssetsWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        let objects = JSON.parse(result);
       
        // check what we have
        if (objects.length === 0) {
            throw new Error('Nothing found');
        }

        logger.info(objects);
        res.status(200).json(objects);

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Query to get processing plant data
router.get('/processing-plant/assets/all/:bookmark', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        let queryString = {
            selector: {
                step: {
                    "$gt": 1,
                    "$lt": 6
                }
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryAssetsWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        let objects = JSON.parse(result);
       
        // check what we have
        if (objects.length === 0) {
            throw new Error('Nothing found');
        }

        logger.info(objects);
        res.status(200).json(objects);

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Query to get finished processing plant data
router.get('/processing-plant/assets/finished/:bookmark', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        let queryString = {
            selector: {
                step: {"$eq": 7}
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryAssetsWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        let objects = JSON.parse(result);
       
        // check what we have
        if (objects.length === 0) {
            throw new Error('Nothing found');
        }

        logger.info(objects);
        res.status(200).json(objects);

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Prosessing plant steps
router.put('/processing-plant/:id', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        let tx = await contract.submitTransaction('upgradeAssetToProsessingPlant', req.params.id, req.body.acceptable, req.body.deliverer);
        let data = await contract.evaluateTransaction('getAsset', req.params.id);
        let answer = JSON.parse(data);
        answer.tx_id = tx.toString();
        logger.info('Transaction has been evaluated');
        res.status(200).json(answer);
        // logger.info(JSON.parse(query_result));
        // res.send('Transaction has been submitted');

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Start next phase
router.put('/assets/:id/start-next-phase', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        let tx = await contract.submitTransaction('startNextPhase', req.params.id, req.body.phase);
        logger.info('Transaction has been evaluated');
        res.status(200).json(tx);
        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: `Failed to evaluate transaction. ${error}`});
    }
});

// Query to get deliver data
router.get('/delivery/assets/all/:bookmark', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        let queryString = {
            selector: {
                step: {
                    "$eq": 9
                }
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryAssetsWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        let objects = JSON.parse(result);
       
        // check what we have
        if (objects.length === 0) {
            throw new Error('Nothing found');
        }

        logger.info(objects);
        res.status(200).json(objects);

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Query to get finished delivery data
router.get('/delivery/assets/finished/:bookmark', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        let queryString = {
            selector: {
                step: {"$eq": 10}
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryAssetsWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        let objects = JSON.parse(result);
       
        // check what we have
        if (objects.length === 0) {
            throw new Error('Nothing found');
        }

        logger.info(objects);
        res.status(200).json(objects);

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Query to get waiting list of delivery data
router.get('/delivery/assets/confirmation/:bookmark', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        let queryString = {
            selector: {
                step: {"$eq": 8},
                delivery: {
                    status: 'PENDING'
                }
            }
        };
        let bookmark = (req.params.bookmark !== '0') ? req.params.bookmark : ''; 
        const result = await contract.evaluateTransaction('queryAssetsWithPagination',
                    JSON.stringify(queryString), 10,
                    bookmark);
        let objects = JSON.parse(result);
       
        // check what we have
        if (objects.length === 0) {
            throw new Error('Nothing found');
        }

        logger.info(objects);
        res.status(200).json(objects);

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

// Delivery - start
router.put('/delivery/:id', async function (req, res) {
    const decoded = helper.decodeJwt(req.headers['authorization']);
    try {
        // Get the contract from the network
        const {contract, gateway} = await fabricNetwork.connectNetwork(decoded['email'], decoded['orgname']);

        // Evaluate the specified transaction.
        // getAsset transaction - requires 1 argument, ex: ('getAsset', 'Cage1')
        let tx = await contract.submitTransaction('upgradeAssetToDelivery', req.params.id, req.body.address, req.body.deliverer);
        let data = await contract.evaluateTransaction('getAsset', req.params.id);
        let answer = JSON.parse(data);
        answer.tx_id = tx.toString();
        logger.info('Transaction has been evaluated');
        res.status(200).json(answer);
        // logger.info(JSON.parse(query_result));
        // res.send('Transaction has been submitted');

        // disconnect the gateway
        // await gateway.disconnect();
    } catch (error) {
        logger.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({error: 'Failed to evaluate transaction. Please try again'});
    }
});

module.exports = router;