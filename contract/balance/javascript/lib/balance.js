/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class Balance extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const users = [
            {
		id: '1',
                name: 'Usmonov Kamol',
                balance: '100',
            },
            {
		id: '2',		                
		name: 'Alimov Bahor',
                balance: '1000',
            },
            {
		id: '3',
                name: 'John Depth',
                balance: '0',
            },
	    {
		id: '4',
                name: 'Eric Mandiy',
                balance: '50',
            },
        ];

        for (let i = 0; i < users.length; i++) {
            await ctx.stub.putState('User' + i, Buffer.from(JSON.stringify(users[i])));
            console.info('Added <--> ', users[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryUser(ctx, userId) {
        const userAsBytes = await ctx.stub.getState(userId); // get the user from chaincode state
        if (!userAsBytes || userAsBytes.length === 0) {
            throw new Error(`${userId} does not exist`);
        }
        console.log(userAsBytes.toString());
        return userAsBytes.toString();
    }

    async createUser(ctx, id, name, balance) {
        console.info('============= START : Create user ===========');

        const user = {
            id,
            name,
            balance,
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(user)));
        console.info('============= END : Create user ===========');
    }

    async queryAllUsers(ctx) {
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

    async changeUserBalance(ctx, id, newBalance) {
        console.info('============= START : changeUserBalance ===========');

        const userAsBytes = await ctx.stub.getState(id); // get the car from chaincode state
        if (!userAsBytes || userAsBytes.length === 0) {
            throw new Error(`${userAsBytes} does not exist`);
        }
        const user = JSON.parse(userAsBytes.toString());
        user.balance = newBalance;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(user)));
        console.info('============= END : changeUserBalance ===========');
    }

}

module.exports = Balance;
