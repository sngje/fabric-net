/*
 * Author: Kamoliddin Usmonov
 * Contact: usmonov.me@gmail.com
 * Chonnam National University
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class Farm extends Contract {
    // init state which calls from chaincode installition
    async initLedger(ctx) {
        const assets = [
            {
                docType: 'duck',
                age: 2,
                vaccination: false,
                step: 1,
            },
            {
                docType: 'duck',
                age: 2,
                vaccination: false,
                step: 1,
            },
            {
                docType: 'duck',
                age: 2,
                vaccination: true,
                step: 1,
            },
        ];

        for (let i = 0; i < assets.length; i++) {
            await ctx.stub.putState('Cage' + i, Buffer.from(JSON.stringify(assets[i])));
            console.info('Added <--> ', assets[i]);
        }
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

    // create new asset
    async createAsset(ctx, id, age, injected = false) {
        const assetExists = await this.assetExists(ctx, id);
        if (assetExists) {
            throw new Error(`This asset with ${id} already exists`);
        }

        const int_age = parseInt(age);
		if (typeof int_age !== "number") {
			throw new Error("Age argument must be a numeric string");
        }

        // const condition = (String(injected) === 'true') ? true : false;
        const asset = {
            docType: 'duck',
            age: int_age,
            vaccination: injected,
            step: 1,
        };

        ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return ctx.stub.getTxID();
    }

    async updateAsset(ctx, id, age, vaccination, step) {
        // get data and check
        const currentAsset = await this.getAsset(ctx, id); // get the cage from chaincode state
        let newAsset = JSON.parse(currentAsset); 

        // set default values if not defined
        age = typeof age !== 'undefined' ? parseInt(age) : newAsset.age;
        vaccination = typeof vaccination !== 'undefined' ? ((String(vaccination) === 'true') ? true : false) : newAsset.vaccination;
        step = typeof step !== 'undefined' ? parseInt(step) : newAsset.step;
        // update asset
        newAsset.age = age;
        newAsset.vaccination = vaccination;
        newAsset.step = step;

        // commit changes
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(newAsset)));
        return ctx.stub.getTxID();
    }
    
    // update asset age properity
    async updateAssetAge(ctx, id) {
        const currentAsset = await this.getAsset(ctx, id);
        let newAsset = JSON.parse(currentAsset);        
        
        let age = parseInt(newAsset.age) + 1
        newAsset.age = age;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(newAsset)));
        return ctx.stub.getTxID();
    }

    // change data vaccination status
    async updateAssetInjectionStatus(ctx, id) {
        const currentAsset = await this.getAsset(ctx, id); // get the cage from chaincode state
        let newAsset = JSON.parse(currentAsset);
        // let condition = !newAsset.vaccination;
        newAsset.vaccination = !newAsset.vaccination;

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
        switch(newAsset.step) {
            case 1:
                status = "RECEIVED";
                break;
            case 2:
                status = "IN_PREPERATION";
                break;
            case 3:
                status = "PACKAGING";
                break;
            case 4:
                status = "SHIPPED";
                break;
            case 5:
                status = "FINISHED";
                break;
            default:
                status = "UNDEFINED_STATUS";
        };

        // add new dictinoary if not exists
        if (typeof newAsset.processing_plant == 'undefined') {
            newAsset.processing_plant = {};
        }

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
        if (newAsset.step < 6) {
            newAsset.step = asset.step + 1;
        } else {
            throw new Error('Processing plant was finished');
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

    // Example: Ad hoc rich query
	// QueryAssets uses a query string to perform a query for assets.
	// Query string matching state database syntax is passed in and executed as is.
	// Supports ad hoc queries that can be defined at runtime by the client.
	// If this is not desired, follow the QueryAssetsForOwner example for parameterized queries.
	// Only available on state databases that support rich query (e.g. CouchDB)
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

    // query specific aged cages
    async queryAssetsByAge(ctx, age) {
        age = typeof age !== 'undefined' ? parseInt(age) : 'undefined';

		if (typeof int_age !== "number") {
			throw new Error("Age argument must be a numeric string");
        }
    
        let queryString = {};
        queryString.selector = {};
        queryString.selector.age = age;
        return await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
    }

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
