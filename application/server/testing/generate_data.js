'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const helper = require('../config/helper');
const user = 'usmonov.me@gmail.com';

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), '../org1-wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(user);
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: user, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('farm');

        // Submit the specified transaction.
        // let vaccination = Buffer.from(JSON.stringify({cholera: true, plague: false}));
        // const values = {
        //     age: parseInt(5),
        //     vaccination: false
        // };

        const v_status = [true, false];

        for (let i = 0; i < 20; i ++) {
            let current_time = helper.getDateAsString();
            let randomId = helper.generateRandomId()
            let randomQuantity = Math.floor(Math.random() * (1000 - 10 + 1));
            let randomSerial = helper.generateRandomId(2);
            let tx = await contract.submitTransaction('createAsset', randomId, current_time, randomQuantity, randomSerial, 'CR - auto', 'usmonov.me@gmail.com`');
            console.log(`${i} ok - ${tx.toString()}`);
        }

        // Disconnect from the gateway.
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}

main();
