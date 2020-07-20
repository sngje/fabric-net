'use strict';

// Setting for Hyperledger Fabric
const {  Wallets,  Gateway} = require('fabric-network');
const IDENTITY = 'appUser';
const CHANNEL = 'mychannel';
const CONTRACT = 'farm';
const path = require('path');
const fs = require('fs');

async function connectNetwork() {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), '../wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const userExists = await wallet.get(IDENTITY);
    if (!userExists) {
        console.log('An identity for the user "appUser" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }
    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: IDENTITY,
        discovery: {
            enabled: true,
            asLocalhost: true
        }
    });
    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork(CHANNEL);
    // Get the contract from the network.
    const contract = network.getContract(CONTRACT);
    return {
        contract: contract,
        gateway: gateway
    };
}

module.exports = {connectNetwork};
