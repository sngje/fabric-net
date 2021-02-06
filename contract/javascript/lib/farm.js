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

    // delete asset
    async deleteAsset(ctx, id) {
        const assetExists = await this.assetExists(ctx, id); // get the cage from chaincode state
        if (!assetExists) {
            throw new Error(`Asset ${id} does not exist`);
        }
    

        await ctx.stub.deleteState(id);
        return 'Deleted';
    }

    // create new asset
    async createAsset(ctx, id, injected, age) {
        const assetExists = await this.assetExists(ctx, id);
        if (assetExists) {
            throw new Error(`This asset with ${id} already exists`);
        }

        const int_age = parseInt(age);
		if (typeof int_age !== "number") {
			throw new Error("Age argument must be a numeric string");
        }

        const condition = (String(injected) === 'true') ? true : false;
        const asset = {
            docType: 'duck',
            age: int_age,
            vaccination: condition,
            step: 1,
        };

        ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return ctx.stub.getTxID();
    }

    async updateAsset(ctx, id, age, vaccination, step) {
        // get data and check
        const currentAsset = await this.getAsset(ctx, id); // get the cage from chaincode state
        let asset = JSON.parse(currentAsset); 

        // set default values if not defined
        age = typeof age !== 'undefined' ? parseInt(age) : asset.age;
        vaccination = typeof vaccination !== 'undefined' ? ((String(vaccination) === 'true') ? true : false) : asset.vaccination;
        step = typeof step !== 'undefined' ? parseInt(step) : asset.step;
        // update asset
        asset.age = age;
        asset.vaccination = vaccination;
        asset.step = step;

        // commit changes
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return ctx.stub.getTxID();
    }
    
    // update asset age properity
    async updateAssetAge(ctx, id, age) {
        const currentAsset = await this.getAsset(ctx, id);
        let asset = JSON.parse(currentAsset);        
        
        age = typeof age !== 'undefined' ? age : asset.age + 1
        asset.age = age;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return ctx.stub.getTxID();
    }

    // change data vaccination status
    async updateAssetInjectionStatus(ctx, id, newStatus) {
        const currentAsset = await this.getAsset(ctx, id); // get the cage from chaincode state
        let asset = JSON.parse(currentAsset);
        let condition = (String(newStatus) === 'true') ? true : false;
        asset.vaccination = condition;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return ctx.stub.getTxID();
    }
    
    // get all cages with history
    async queryAllCages(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    // get cages with vaccination filter
    async queryWithVaccination(ctx, vaccination) {        
        let condition = (String(vaccination) === 'true') ? true : false;
        let queryString = {};
        queryString.selector = {};
        queryString.selector.vaccination = condition;
        //use_index: ['_design/indexVcDoc', 'indexVc']
        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;
    }

    // query specific aged cages
    async queryWithAge(ctx, age) {
        age = typeof age !== 'undefined' ? parseInt(age) : 'undefined';

		if (typeof int_age !== "number") {
			throw new Error("Age argument must be a numeric string");
        }
    
        let queryString = {};
        queryString.selector = {};
        queryString.selector.age = age;
        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;
    }

    // get all data which dockType is 'duck'
    async queryAll(ctx) {
        let queryString = {
            selector: {
                docType: 'duck'
            }
        };
        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;
    }
    
    // wrapper function
    async queryWithQueryString(ctx, queryString) {
        // let queryString = JSON.stringify(queryString);
        console.log('queryWithQueryString: start');
        // console.log(JSON.parse(queryString));

        let resultsIterator = await ctx.stub.getQueryResult(queryString);

        let allResults = [];

        // eslint-disable-next-line no-constant-condition
        while (true) {
            let res = await resultsIterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};

                console.log(res.value.value.toString('utf8'));

                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }

                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await resultsIterator.close();
                console.info(allResults);
                console.log(JSON.stringify(allResults));
                return JSON.stringify(allResults);
            }
        }

    }

    //new way
    async getFullHistory(ctx, key) {
        const promiseOfIterator = ctx.stub.getHistoryForKey(key);
        const results = [];
        for await (const keyMod of promiseOfIterator) {
            // const tx = keyMod.getTxId();
            const resp = {
                timestamp: keyMod.timestamp
            }
            if (keyMod.is_delete) {
                resp.data = 'KEY DELETED';
            } else {
                resp.data = JSON.parse(keyMod.value.toString('utf8'));
            }
            resp.tx_id = keyMod.txId;
            results.push(resp);
        }
        console.log(results);
        return JSON.stringify(results);
    }

    // get data from iterator
    async getAllResults(promiseOfIterator) {
        const allResults = [];
        for await (const res of promiseOfIterator) {
            // no more res.value.value ...
            // if not a getHistoryForKey iterator then key is contained in res.key
            const resp = {
                key: res.key.toString('utf8'),
            }
            if (res.is_delete) {
                resp.data = 'KEY DELETED';
            } else {
                resp.data = JSON.parse(res.value.toString('utf8'));
            }
            allResults.push(resp);
        }
    
        // iterator will be automatically closed on exit from the loop
        // either by reaching the end, or a break or throw terminated the loop
        return allResults;
    }

    // Get data with pagination
    async queryWithPagination(ctx, query_string, page_size, bookmark) {
        // convert to integer
        const pageSize = parseInt(page_size);
        const promiseOfIterator = ctx.stub.getQueryResultWithPagination(query_string, pageSize, bookmark);
        const results = await this.getAllResults(promiseOfIterator);
        // exract meta data informations
        const metadata = (await promiseOfIterator).metadata;
        const alldata = {data: results, meta_data: metadata};
        return JSON.stringify(alldata);
    }

    // Prosessing plant logic goes here
    async upgradeAssetToProsessingPlant(ctx, id, acceptable, deliverer) {
        // check data if exists
        const currentAsset = await this.getAsset(ctx, id);
        // get the data as json format
        const asset = JSON.parse(currentAsset);
        let status;

        // steps by definition
        switch(asset.step) {
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
        if (typeof asset.processing_plant == 'undefined') {
            asset.processing_plant = {};
        }

        //update status
        asset.processing_plant.status = status;

        // if it's PACKAGING status, set inspected to given condition
        if (status === "PACKAGING") {
            let condition = (String(acceptable) === 'true') ? 'VALID' : 'INVALID';
            asset.processing_plant.inspected = condition;
        }

        // if it's SHIPPED status, set deliverer number
        if (status === "SHIPPED") {
            asset.processing_plant.deliverer = deliverer;
        }

        // control step and update if needed
        if (asset.step < 6) {
            asset.step = asset.step + 1;
        } else {
            throw new Error('Processing plant was finished');
        }
        
        // update the state
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return ctx.stub.getTxID();
    }
}

module.exports = Farm;
