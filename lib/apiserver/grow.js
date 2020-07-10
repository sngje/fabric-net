'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');


async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('farm');

        // get all cages from couchdb and convert to JSON object
        const result = await contract.evaluateTransaction('queryAllCages');
        let objects = JSON.parse(result);
        
        // check what we have
        if (objects.length === 0) {
            throw new Error('All cages are injected');
        }
        
        // iterate objects to obtain key and age values
        // increment age values + one, then update the ledger
        for (let i = 0; i < objects.length; i++) {
            let object = objects[i];
            let key = object.Key;
            let age = +object.Record.age + 1;
            let tx = await contract.submitTransaction('changeCageAge', key, age);
            console.log(`OK - ${tx}`);
        }

        // disconnect the geteaway
        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();