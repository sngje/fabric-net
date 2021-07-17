/*
 * Author: Kamoliddin Usmonov
 * Contact: usmonov.me@gmail.com
 * Chonnam National University
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class Farm extends Contract {
    constructor() {
        super('Farm');
        this.tx_id = '';
    }

    async beforeTransaction(ctx) {
        this.tx_id = ctx.stub.getTxID();
        // this.timestamp = ctx.stub.GetTxTimestamp();
        console.log('TxID called');
    }

    async afterTransaction(ctx, result) {
        console.log(`TX - ${this.tx_id}`);
    }

    // init state which calls from chaincode installition
    async initLedger(ctx) {
        const assets = {
                docType: 'duck',
                product_serial: 'WB',
                quantity: 500,
                message: 'Block created',
                flag: 'PR',
                step: 1,
                tx_id: this.tx_id,
        };

        // for (let i = 0; i < assets.length; i++) {
            // const id = this.generateRandomId(8);
            await ctx.stub.putState('qpAt6q7amIz', Buffer.from(JSON.stringify(assets)));
            console.info('Added <--> ', assets);
        // }
    }

    // assetExists returns true when asset exists in world state within given id
    async assetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        console.log(assetJSON && assetJSON.length > 0);
        return assetJSON && assetJSON.length > 0;
    }

    // readAsset returns the asset stored in the world state with given id
    async getAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        console.log(assetJSON.toString());
        return assetJSON.toString();
    }

    // deleteAsset removes  asset from word-state permanently
    async deleteAsset(ctx, id) {
        const assetExists = await this.assetExists(ctx, id); // get the cage from chaincode state
        if (!assetExists) {
            throw new Error(`Asset ${id} does not exist`);
        }

        await ctx.stub.deleteState(id);
        return 'Deleted';
    }

    // Create new asset
    async createAsset(ctx, id, timestamp, quantity, product_serial, message) {
        const assetExists = await this.assetExists(ctx, id);
        if (assetExists) {
            throw new Error(`This asset with ${id} already exists`);
        }

        const int_quantity = parseInt(quantity);
		if (typeof int_quantity !== "number") {
			throw new Error("Quantity argument must be a numeric string");
        }

        if (typeof message === 'undefined') {
            message = 'Block created';
        }

        // const condition = (String(injected) === 'true') ? true : false;
        const asset = {
            docType: 'duck',
            product_serial: product_serial,
            quantity: int_quantity,
            timestamp: timestamp,
            message: message,
            flag: 'PR',
            step: 1,
            tx_id: this.tx_id,
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return ctx.stub.getTxID();
    }

    // Update asset
    async updateAsset(ctx, id, quantity, message, product_serial) {
        // get data and check
        const currentAsset = await this.getAsset(ctx, id); // get the cage from chaincode state
        let newAsset = JSON.parse(currentAsset); 

        // set default values if not defined
        quantity = typeof quantity !== 'undefined' ? parseInt(quantity) : newAsset.quantity;

        // update asset
        newAsset.quantity = quantity;
        newAsset.message = message;
        newAsset.product_serial = product_serial;

        // commit changes
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(newAsset)));
        return ctx.stub.getTxID();
    }
    
    // update asset age properity
    // async updateAssetAge(ctx, id) {
    //     const currentAsset = await this.getAsset(ctx, id);
    //     let newAsset = JSON.parse(currentAsset);        
        
    //     let age = parseInt(newAsset.age) + 1
    //     newAsset.age = age;

    //     await ctx.stub.putState(id, Buffer.from(JSON.stringify(newAsset)));
    //     return ctx.stub.getTxID();
    // }

    // change data vaccination status
    
    // async updateAssetInjectionStatus(ctx, id) {
    //     const currentAsset = await this.getAsset(ctx, id); // get the cage from chaincode state
    //     let newAsset = JSON.parse(currentAsset);
    //     // let condition = !newAsset.vaccination;
    //     newAsset.vaccination = !newAsset.vaccination;

    //     await ctx.stub.putState(id, Buffer.from(JSON.stringify(newAsset)));
    //     return ctx.stub.getTxID();
    // }

    // phase shows different divistion as number
    // phase 1 = PROCESSING_PLANT
    // phase 2 = DELIVERY
    async sendRequest(ctx, id, flag) {
        const currentAsset = await this.getAsset(ctx, id);
        // get the data as json format
        const newAsset = JSON.parse(currentAsset);
        // if (newAsset.age < 5 || newAsset.vaccination != true) {
        //     throw new Error('Asset is not accaptable yet, age must be at least 5 and vaccination should be true');
        // }
        newAsset.flag = 'CR';
        if (flag == 'CR') {
            // add new dictinoary if not exists
            if (typeof newAsset.cultivator == 'undefined') {
                newAsset.cultivator = {};
            }
            newAsset.cultivator.status = 'PENDING';
        } else if (flag ==  'SR') {
            // add new dictinoary if not exists
            if (typeof newAsset.supplier == 'undefined') {
                newAsset.supplier = {};
            }
            newAsset.supplier.status = 'PENDING';
        } else {
            throw new Error('Phase not found, please check the value and try again');
        }
        
        // update the state
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(newAsset)));
        return ctx.stub.getTxID();
    }

    // Prosessing plant logic goes here
    async addDeliveryInfo(ctx, id, flag, deliverer, message, timestamp) {
        // Check data if exists
        const currentAsset = await this.getAsset(ctx, id);
        // Get the data as json format
        const asset = JSON.parse(currentAsset);
        
        // Update asset - delivery information
        if (flag === 'CR') {
            asset.cultivator.status = 'RECEIVED';
            asset.cultivator.delivery = {
                'message': message,
                'deliverer': deliverer,
                'timestamp': timestamp,
            }
        } else {
            asset.cultivator.status = 'FINISHED';
            asset.supplier.status = 'RECEIVED';
            asset.supplier.delivery = {
                'message': message,
                'deliverer': deliverer,
                'timestamp': timestamp,
            }
        }
    
        // Update the state
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return ctx.stub.getTxID();
    }

    async upgradeAssetToSupplier(ctx, id, deliverer, message, timestamp) {
        // check data if exists
        const currentAsset = await this.getAsset(ctx, id);
        // get the data as json format
        const newAsset = JSON.parse(currentAsset);

        //update status
        newAsset.supplier.status = 'RECEIVED';

        newAsset.supplier.delivery = {
            'message': message,
            'deliverer': deliverer,
            'timestamp': timestamp,
        }

        // update the state
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(newAsset)));
        return ctx.stub.getTxID();
    }
    
    // Prosessing plant logic goes here
    async upgradeAssetToProsessingPlant(ctx, id, acceptable, deliverer) {
        // check data if exists
        const currentAsset = await this.getAsset(ctx, id);
        // get the data as json format
        const newAsset = JSON.parse(currentAsset);
        let status;

        // steps by definition
        switch(newAsset.step + 1) {
            case 3:
                status = "RECEIVED";
                break;
            case 4:
                status = "IN_PREPERATION";
                break;
            case 5:
                status = "PACKAGING";
                break;
            case 6:
                status = "SHIPPED";
                break;
            case 7:
                status = "FINISHED";
                break;
            default:
                status = "UNDEFINED_STATUS";
        };

        //update status
        newAsset.processing_plant.status = status;

        // if it's PACKAGING status, set inspected to given condition
        if (status === "PACKAGING") {
            let condition = (String(acceptable) === 'true') ? 'VALID' : 'INVALID';
            newAsset.processing_plant.inspected = condition;
        }

        // if it's SHIPPED status, set deliverer number
        if (status === "SHIPPED") {
            newAsset.processing_plant.deliverer = deliverer;
        }

        // control step and update if needed
        if (newAsset.step < 7) {
            newAsset.step = newAsset.step + 1;
        } else {
            throw new Error('Processing plant was finished');
        }
        
        // update the state
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(newAsset)));
        return ctx.stub.getTxID();
    }
    
    // Upgrade to delivery
    async upgradeAssetToDelivery(ctx, id, address, deliverer) {
        // check data if exists
        const currentAsset = await this.getAsset(ctx, id);
        // get the data as json format
        const newAsset = JSON.parse(currentAsset);
        let status;
        // steps by definition
        switch(newAsset.step + 1) {
            case 9:
                status = "PICKED";
                break;
            case 10:
                status = "FINISHED";
                break;
        };

        if (status === 'PICKED') {
            newAsset.delivery.deliverer = deliverer;
        }

        if (status === 'FINISHED') {
            newAsset.delivery.store_address = address;
        }
        //update status
        newAsset.delivery.status = status;

        // control step and update if needed
        if (newAsset.step < 10) {
            newAsset.step = newAsset.step + 1;
        } else {
            throw new Error('Delivery was finished');
        }
        
        // update the state
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(newAsset)));
        return ctx.stub.getTxID();
    }
    // GetAssetHistory returns the chain of custody for an asset since issuance.
	async getAssetHistory(ctx, assetKey) {

		let resultsIterator = await ctx.stub.getHistoryForKey(assetKey);
		let results = await this.getAllResults(resultsIterator, true);

		return JSON.stringify(results);
    }
    
    // get assets by range - startKey - endKey
    async getAssetsByRange(ctx, startKey, endKey) {

		let resultsIterator = await ctx.stub.getStateByRange(startKey, endKey);
		let results = await this.getAllResults(resultsIterator, false);

		return JSON.stringify(results);
	}

    // GetQueryResultForQueryString executes the passed in query string.
	// Result set is built and returned as a byte array containing the JSON results.
	async getQueryResultForQueryString(ctx, queryString) {

		let resultsIterator = await ctx.stub.getQueryResult(queryString);
		let results = await this.getAllResults(resultsIterator, false);

		return JSON.stringify(results);
	}

    // Wrapper method
    async queryAssets(ctx, queryString) {
		return await this.getQueryResultForQueryString(ctx, queryString);
	}

    // Wrapper method
    async getAllResults(iterator, isHistory) {
		let allResults = [];
		let res = await iterator.next();
		while (!res.done) {
			if (res.value && res.value.value.toString()) {
				let jsonRes = {};
				console.log(res.value.value.toString('utf8'));
				if (isHistory && isHistory === true) {
					jsonRes.tx_id = res.value.txId;
					jsonRes.timestamp = res.value.timestamp;
					try {
						jsonRes.data = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.data = res.value.value.toString('utf8');
					}
				} else {
					jsonRes.key = res.value.key;
					try {
						jsonRes.data = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.data = res.value.value.toString('utf8');
					}
				}
				allResults.push(jsonRes);
			}
			res = await iterator.next();
		}
		iterator.close();
		return allResults;
	}

    // get cages with vaccination filter
    async queryAssetsByVaccinationStatus(ctx, vaccination) {        
        let condition = (String(vaccination) === 'true') ? true : false;
        let queryString = {};
        queryString.selector = {};
        queryString.selector.vaccination = condition;
        //use_index: ['_design/indexVcDoc', 'indexVc']
        return await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    // quer y specific aged cages
    // async queryAssetsByAge(ctx, age) {
    //     age = typeof age !== 'undefined' ? parseInt(age) : 'undefined';

	// 	if (typeof int_age !== "number") {
	// 		throw new Error("Age argument must be a numeric string");
    //     }
    
    //     let queryString = {};
    //     queryString.selector = {};
    //     queryString.selector.age = age;
    //     return await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
    // }

    // get all data which dockType is 'duck'
    async queryAssetsAll(ctx) {
        let queryString = {
            selector: {
                docType: 'duck'
            }
        };
        return await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

    // Get data with pagination
    async queryAssetsWithPagination(ctx, query_string, page_size, bookmark) {
        // convert to integer
        const pageSize = parseInt(page_size);
        const {iterator, metadata} = await ctx.stub.getQueryResultWithPagination(query_string, pageSize, bookmark);
        const results = await this.getAllResults(iterator, false);
        // exract meta data informations
        const alldata = {data: results, meta_data: metadata};
        return JSON.stringify(alldata);
    }
}

module.exports = Farm;
