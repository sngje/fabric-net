
'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');


async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
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

        const client = gateway.getClient();
        const peers = client.getPeersForOrg('PeerMSP');

        let installResponse = await client.installChaincode({
            targets: peers,
            chaincodePath: '/contract/javascript',
            chaincodeId: 'farm',
            chaincodeVersion: '2.0.1',
            chaincodeType: 'node',
            channelNames: ['mychannel']
        });

        let channel = client.getChannel('mychannel');

        let proposalResponse = await channel.sendUpgradeProposal({
            targets: peers,
            chaincodeType: 'node',
            chaincodeId: 'farm',
            chaincodeVersion: '2.0.1',
            args: [],
            fcn: 'queryAll',
            txId: client.newTransactionID()
        });

        console.log(proposalResponse);

        console.log('Sending the Transaction ..');
        const transactionResponse = await channel.sendTransaction({
            proposalResponses: proposalResponse[0],
            proposal: proposalResponse[1]
        });

        console.log(transactionResponse);
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();