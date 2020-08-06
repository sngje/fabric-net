## Running the test network:

You can use the `./network.sh` script to stand up a simple Farm test network. The test network has two peer organizations with one peer each and a single node raft ordering service. You can also use the `./network.sh` script to create channels. 


## Start network and install chaincode:

Alternatively, you can run the network with `./start.sh` file which located in `application`folder. It will install npm packages then install, instantiate and approve chaincode.

## Init project

Inside application folder, run `./init.sh` command to install npm packages, create admin and user credentials.

If you want to get all data from ledger and submit transaction, run `node queryallcages.js`, `node injection.js` as well.

## Latest update

If you want to save your ledger data, then run `docker stop $(docker ps -aq) && docker rm $(docker ps -aq)` insted of `.stop.sh` command. This will create copy of the ledger inside `data_archive` folder. To bring up network, run the following command inside `docker` folder:
`docker-compose -f docker-compose-ca.yaml -f docker-compose-test-network.yaml -f docker-compose-couch.yaml`. 

## Troubleshooting

If you run into error while bringing up network, create `.env` file inside docker folder and add the following lines:
`COMPOSE_PROJECT_NAME=net`
`IMAGE_TAG=latest`