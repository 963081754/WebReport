module.exports = {
    little_sql_chain_cache: {
        max_count: 30,  // 允许缓存的小的SQL chain的最大大小。
        getKey: function(id){
            return `little_sql_chain_${id}_count`
        },
        time: 1000*60*60*12  // 缓存12小时
    }, // 允许缓存的小的SQL
    download: {
        maxRowCount: 10000*5, // 下载最大行数5万条
        maxItemsIdCount: 2000 // SQL chain, 拼接SQL是，in (xx,xx,xx……) xx的最多个数
    }
}