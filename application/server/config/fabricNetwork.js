'use strict';

// Setting for Hyperledger Fabric
const {Wallets,  Gateway} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const CHANNEL = 'mychannel';
const CONTRACT = 'farm';
const path = require('path');
const fs = require('fs');

const log4js = require('log4js');
const logger = log4js.getLogger('FabricNetworkApplication');

const getCCP = async (org) => {
    let ccpPath;
    if (org == "Org1") {
        ccpPath = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    } else if (org == "Org2") {
        ccpPath = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org2.example.com', 'connection-org2.json');
    } else if (org == "Org3") {
        ccpPath = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org3.example.com', 'connection-org3.json');
    } else {
        return null;
    }
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    return ccp;
}

const getCaUrl = async (org, ccp) => {
    let caURL;
    if (org == "Org1") {
        caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
    } else if (org == "Org2") {
        caURL = ccp.certificateAuthorities['ca.org2.example.com'].url;
    } else if (org == "Org3") {
        caURL = ccp.certificateAuthorities['ca.org3.example.com'].url;
    } else {
        return null;
    }
    return caURL;

}

const getWalletPath = async (org) => {
    let walletPath;
    if (org == "Org1") {
        walletPath = path.join(process.cwd(), './org1-wallet');
    } else if (org == "Org2") {
        walletPath = path.join(process.cwd(), './org2-wallet');
    } else if (org == "Org3") {
        walletPath = path.join(process.cwd(), './org3-wallet');
    } else {
        return null;
    }
    return walletPath;

}


const getAffiliation = async (org) => {
    if (org == "Org1") {
        return "org1.department1";
    } else if (org == "Org2") {
        return "org2.department1";
    } else if (org == "Org3") {
        return "org3.department1";
    } else {
        return null;
    }
}

const getRegisteredUser = async (username, orgname) => {
    let ccp = await getCCP(orgname);

    const caURL = await getCaUrl(orgname, ccp);
    const ca = new FabricCAServices(caURL);

    const walletPath = await getWalletPath(orgname);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    logger.info(`Wallet path: ${walletPath}`);

    // Check to see if username enrolled already
    const userIdentity = await wallet.get(username);
    if (userIdentity) {
        logger.info(`An identity for the user ${username} already exists in the wallet`);
        let response = {
            success: true,
            message: username + ' enrolled Successfully',
        };
        return response;
    }

    // Check to see if we've already enrolled the admin user.
    let adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
        logger.info('An identity for the admin user "admin" does not exist in the wallet');
        await enrollAdmin(orgname, ccp);
        adminIdentity = await wallet.get('admin');
        logger.info("Admin Enrolled Successfully");
    }

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');
    let secret;
    try {
        // Register the user, enroll the user, and import the new identity into the wallet.
        secret = await ca.register({ affiliation: await getAffiliation(orgname), enrollmentID: username, role: 'client' }, adminUser);
        // const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: username, role: 'client', attrs: [{ name: 'role', value: 'approver', ecert: true }] }, adminUser);
    } catch (error) {
        return error.message;
    }

    const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
    // const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret, attr_reqs: [{ name: 'role', optional: false }] });

    let x509Identity;
    if (orgname == "Org1") {
        x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
    } else if (orgname == "Org2") {
        x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org2MSP',
            type: 'X.509',
        };
    } else if (orgname == "Org3") {
        x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org3MSP',
            type: 'X.509',
        };
    }

    await wallet.put(username, x509Identity);
    logger.info(`Successfully registered and enrolled admin user ${username} and imported it into the wallet`);

    let response = {
        success: true,
        message: username + ' enrolled Successfully',
    };
    return response;
}

const isUserRegistered = async  (username, orgname) => {
    const walletPath = await getWalletPath(orgname);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    logger.info(`Wallet path: ${walletPath}`);

    const userIdentity = await wallet.get(username);
    if (userIdentity) {
        logger.info(`An identity for the user ${username} exists in the wallet`);
        return true;
    }
    return false;
}


const getCaInfo = async (org, ccp) => {
    let caInfo;
    if (org == "Org1") {
        caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    } else if (org == "Org2") {
        caInfo = ccp.certificateAuthorities['ca.org2.example.com'];
    } else if (org == "Org3") {
        caInfo = ccp.certificateAuthorities['ca.org3.example.com'];
    } else {
        return null;
    }
    return caInfo;

}

const enrollAdmin = async (org, ccp) => {

    logger.info('Calling enroll Admin method')

    try {

        const caInfo = await getCaInfo(org, ccp) //ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Create a new file system based wallet for managing identities.
        const walletPath = await getWalletPath(org) //path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        logger.info(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get('admin');
        if (identity) {
            logger.info('An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        let x509Identity;
        if (org == "Org1") {
            x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org1MSP',
                type: 'X.509',
            };
        } else if (org == "Org2") {
            x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org2MSP',
                type: 'X.509',
            };
        } else if (org == "Org3") {
            x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org3MSP',
                type: 'X.509',
            };
        }

        await wallet.put('admin', x509Identity);
        logger.info('Successfully enrolled admin user "admin" and imported it into the wallet');
        return
    } catch (error) {
        console.error(`Failed to enroll admin user "admin": ${error}`);
    }
}


async function connectNetwork(username, orgname) {
    const ccp = await getCCP(orgname);

    // Create a new file system based wallet for managing identities.
    const walletPath = await getWalletPath(orgname);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.debug(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const userExists = await wallet.get(username);
    if (!userExists) {
        logger.info('An identity for the user "%s" does not exist in the wallet', username);
        return;
    }
    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: username,
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

// module.exports = {connectNetwork};
// exports.getRegisteredUser = getRegisteredUser
module.exports = {
    connectNetwork: connectNetwork,
    getCCP: getCCP,
    getWalletPath: getWalletPath,
    getRegisteredUser: getRegisteredUser,
    isUserRegistered: isUserRegistered

}