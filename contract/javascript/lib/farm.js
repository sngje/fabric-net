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
                age: 1,
                vaccination: false,
            },
            {
                docType: 'duck',
                age: 2,
                vaccination: false,
            },
            {
                docType: 'duck',
                age: 3,
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

        const cage = {
            docType: 'duck',
            age: age,
            vaccination: vaccination,
        };

        await ctx.stub.putState(cageId, Buffer.from(JSON.stringify(cage)));
        console.info('============= END : Create cage ===========');
        return ctx.stub.getTxID();
    }

    async changeCageAge(ctx, cageId, newAge) {
        console.info('============= START : changeCageAge ===========');

        const cageAsBytes = await ctx.stub.getState(cageId); // get the cage from chaincode state
        if (!cageAsBytes || cageAsBytes.length === 0) {
            throw new Error(`${cageId} does not exist`);
        }
        const cage = JSON.parse(cageAsBytes.toString());
        cage.age = newAge;

        await ctx.stub.putState(cageId, Buffer.from(JSON.stringify(cage)));
        console.info('============= END : changeCageAge ===========');
        return ctx.stub.getTxID();
    }

    async changeCondition(ctx, cageId, newCondition) {
        console.info('============= START : changeCondition ===========');

        const cageAsBytes = await ctx.stub.getState(cageId); // get the cage from chaincode state
        if (!cageAsBytes || cageAsBytes.length === 0) {
            throw new Error(`${cageAsBytes} does not exist`);
        }
        const cage = JSON.parse(cageAsBytes.toString());
        cage.vaccination = newCondition;

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

    
    async queryWithVaccination(ctx, condition) {
        console.info('============= START : queryWithVaccination ===========');

        let queryString = {};
        queryString.selector = {}
        queryString.selector.vaccination = condition;
        //use_index: ['_design/indexVcDoc', 'indexVc']
        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;

    }

    async queryWithAge(ctx, age) {

        let queryString = {};
        queryString.selector = {}
        queryString.selector.age = age;
        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;

    }

    async queryAll(ctx) {

        let queryString = {
            selector: {}
        };

        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;

    }
    
    async queryWithQueryString(ctx, queryString) {

        console.log('query String');
        console.log(JSON.stringify(queryString));

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
            const resp = {
                timestamp: keyMod.timestamp,
                txid: keyMod.tx_id
            }
            if (keyMod.is_delete) {
                resp.data = 'KEY DELETED';
            } else {
                resp.data = keyMod.value.toString('utf8');
            }
            results.push(resp);
        }
        console.log(results);
        return results;
    }

}

module.exports = Farm;
