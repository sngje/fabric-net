
    //old style
    // async newGetAllResults(iterator, isHistory) {
    //     let allResults = [];
    //     while (true) {
    //         let res = await iterator.next();
    
    //         if (res.value && res.value.value.toString()) {
    //             let jsonRes = {};
    //             console.log(res.value.value.toString('utf8'));
    
    //             if (isHistory && isHistory === true) {
    //                 jsonRes.TxId = res.value.tx_id;
    //                 jsonRes.Timestamp = res.value.timestamp;
    //                 jsonRes.IsDelete = res.value.is_delete.toString();
    //                 try {
    //                     jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
    //                 } catch (err) {
    //                     console.log(err);
    //                     jsonRes.Value = res.value.value.toString('utf8');
    //                 }
    //             } else {
    //                 jsonRes.Key = res.value.key;
    //                 try {
    //                     jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
    //                 } catch (err) {
    //                     console.log(err);
    //                     jsonRes.Record = res.value.value.toString('utf8');
    //                 }
    //             }
    //             allResults.push(jsonRes);
    //         }
    //         if (res.done) {
    //             console.log('end of data');
    //             await iterator.close();
    //             console.info(allResults);
    //             return allResults;
    //         }
    //     }
    // }
      
    // async queryWithPaginationNew(ctx, queryString, page_size, bookmark) {
    //     let pageSize = parseInt(page_size);
    //     let promiseOfIterator = ctx.stub.getQueryResultWithPagination(queryString, pageSize, bookmark);
    //     let results = await this.getAllResults(promiseOfIterator);
    //     let metadata = (await promiseOfIterator).metadata;
    //     results.ResponseMetadata = {
    //         RecordsCount: metadata.fetchedRecordsCount,
    //         Bookmark: metadata.bookmark,
    //     };
    //     return JSON.stringify(results);
    // }

    // old way
    //  async getHistory(ctx, id) {
    //     console.info('============= START : Query History ===========');
    //     let iterator = await ctx.stub.getHistoryForKey(id);
    //     let result = [];
    //     let res = await iterator.next();
    //     while (!res.done) {
    //         if (res.value) {
    //             console.info(`found state update with value: ${res.value.value.toString('utf8')}`);
    //             const obj = JSON.parse(res.value.value.toString('utf8'));
    //             result.push(obj);
    //         }
    //         res = await iterator.next();
    //     }
    //     await iterator.close();
    //     console.info('============= END : Query History ===========');
    //     return result;  
    // }