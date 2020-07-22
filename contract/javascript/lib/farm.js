/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class Farm extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const cages = [
            {
                docType: 'duck',
                age: 2,
                vaccination: false,
            },
            {
                docType: 'duck',
                age: 2,
                vaccination: false,
            },
            {
                docType: 'duck',
                age: 2,
                vaccination: true,
            },
        ];

        for (let i = 0; i < cages.length; i++) {
            await ctx.stub.putState('Cage' + i, Buffer.from(JSON.stringify(cages[i])));
            console.info('Added <--> ', cages[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async createCage(ctx, cageId, vaccination, age) {
        console.info('============= START : Create cage ===========');
        // ==== Check if marble already exists ====
        let cageState = await ctx.stub.getState(cageId);
        if (cageState.toString()) {
            throw new Error("This cage already exists: " + cageId);
        }

        let int_age = parseInt(age);
		if (typeof int_age !== "number") {
			throw new Error("Age argument must be a numeric string");
        }

        let condition = (String(vaccination) === 'true') ? true : false;
        const cage = {
            docType: 'duck',
            age: int_age,
            vaccination: condition,
        };

        await ctx.stub.putState(cageId, Buffer.from(JSON.stringify(cage)));
        console.info('============= END : Create cage ===========');
        return ctx.stub.getTxID();
    }

    async changeCageAge(ctx, cageId) {
        console.info('============= START : changeCageAge ===========');

        const cageAsBytes = await ctx.stub.getState(cageId); // get the cage from chaincode state
        if (!cageAsBytes || cageAsBytes.length === 0) {
            throw new Error(`${cageId} does not exist`);
        }
        const cage = JSON.parse(cageAsBytes.toString());
        
        // let int_age = parseInt(newAge);
		// if (typeof int_age !== "number") {
		// 	throw new Error("Age argument must be a numeric string");
        // }
        
        cage.age = cage.age + 1;

        await ctx.stub.putState(cageId, Buffer.from(JSON.stringify(cage)));
        console.info('============= END : changeCageAge ===========');
        return ctx.stub.getTxID();
    }

    async deleteCage(ctx, cageId) {
        console.info('============= START : deleteCage ===========');

        const cageAsBytes = await ctx.stub.getState(cageId); // get the cage from chaincode state
        if (!cageAsBytes || cageAsBytes.length === 0) {
            throw new Error(`${cageId} does not exist`);
        }
    

        await ctx.stub.deleteState(cageId);
        console.info('============= END : deleteCage ===========');
        // return ctx.stub.getTxID();
        return 'Deleted';
    }

    async changeCondition(ctx, cageId, newCondition) {
        console.info('============= START : changeCondition ===========');

        const cageAsBytes = await ctx.stub.getState(cageId); // get the cage from chaincode state
        if (!cageAsBytes || cageAsBytes.length === 0) {
            throw new Error(`${cageAsBytes} does not exist`);
        }
        const cage = JSON.parse(cageAsBytes.toString());
        let condition = (String(newCondition) === 'true') ? true : false;
        cage.vaccination = condition;

        await ctx.stub.putState(cageId, Buffer.from(JSON.stringify(cage)));
        console.info('============= END : changeCondition ===========');
        return ctx.stub.getTxID();
    }
    
    async queryCage(ctx, cageId) {
        const cageAsBytes = await ctx.stub.getState(cageId); // get the cage from chaincode state
        if (!cageAsBytes || cageAsBytes.length === 0) {
            throw new Error(`${cageId} does not exist`);
        }
        console.log(cageAsBytes.toString());
        return cageAsBytes.toString();
    }
    
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

    
    async queryWithVaccination(ctx, vaccination) {
        console.info('============= START : queryWithVaccination ===========');
        
        let condition = (String(vaccination) === 'true') ? true : false;
        let queryString = {};
        queryString.selector = {};
        queryString.selector.vaccination = condition;
        //use_index: ['_design/indexVcDoc', 'indexVc']
        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;

    }

    async queryWithAge(ctx, age) {

        let int_age = parseInt(age);
		if (typeof int_age !== "number") {
			throw new Error("Age argument must be a numeric string");
        }
        
        let queryString = {};
        queryString.selector = {};
        queryString.selector.age = int_age;
        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;

    }

    async queryAll(ctx) {

        let queryString = {
            selector: {
                docType: 'duck'
            }
        };

        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;

    }
    
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

    // old way
    async getHistory(ctx, id) {
        console.info('============= START : Query History ===========');
        let iterator = await ctx.stub.getHistoryForKey(id);
        let result = [];
        let res = await iterator.next();
        while (!res.done) {
            if (res.value) {
                console.info(`found state update with value: ${res.value.value.toString('utf8')}`);
                const obj = JSON.parse(res.value.value.toString('utf8'));
                result.push(obj);
            }
            res = await iterator.next();
        }
        await iterator.close();
        console.info('============= END : Query History ===========');
        return result;  
    }

    //new way
    async getFullHistory(ctx, key) {
        const promiseOfIterator = ctx.stub.getHistoryForKey(key);
        const results = [];
        for await (const keyMod of promiseOfIterator) {
            // const tx = keyMod.getTxId();
            const resp = {
                timestamp: keyMod.timestamp,
                txid: keyMod.tx_id
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

    async getAllResults(promiseOfIterator) {
        const allResults = [];
        for await (const res of promiseOfIterator) {
            // no more res.value.value ...
            // if not a getHistoryForKey iterator then key is contained in res.key
            allResults.push(res.value.toString('utf8'));
        }
    
        // iterator will be automatically closed on exit from the loop
        // either by reaching the end, or a break or throw terminated the loop
        return allResults;
    }
    

    //old style
    async newGetAllResults(iterator, isHistory) {
        let allResults = [];
        while (true) {
            let res = await iterator.next();
    
            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));
    
                if (isHistory && isHistory === true) {
                    jsonRes.TxId = res.value.tx_id;
                    jsonRes.Timestamp = res.value.timestamp;
                    jsonRes.IsDelete = res.value.is_delete.toString();
                    try {
                        jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return allResults;
            }
        }
    }
      
    async queryWithPaginationNew(ctx, queryString, page_size, bookmark) {
        let pageSize = parseInt(page_size);
        let promiseOfIterator = ctx.stub.getQueryResultWithPagination(queryString, pageSize, bookmark);
        let results = await this.getAllResults(promiseOfIterator);
        const metadata = (await promiseOfIterator).metadata;
        let ResponseMetadata = {
            RecordsCount: metadata.fetched_records_count,
            Bookmark: metadata.bookmark,
        };
        return JSON.stringify({data: results, meta: ResponseMetadata});
    }

    async queryWithPagination(ctx, queryString, page_size, bookmark) {
        let pageSize = parseInt(page_size);
        const { iterator, metadata } = await ctx.stub.getQueryResultWithPagination(queryString, pageSize, bookmark);
        let results = await this.newGetAllResults(iterator, false);
        // use RecordsCount and Bookmark to keep consistency with the go sample
        results.ResponseMetadata = {
            RecordsCount: metadata.fetched_records_count,
            Bookmark: metadata.bookmark,
        };
        return JSON.stringify(results);
    }
    
    
}

module.exports = Farm;
