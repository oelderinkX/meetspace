let sql_cache = [];

async function query(pool, sql, values, expireSeconds) {
    let result = getSql(sql, values);

    if (result === null) {
        console.log('query: No cache');

        const client = await pool.connect();
		result = await client.query(sql, values);
        client.release();

        setSql(sql, values, result, expireSeconds);
    }
    
    return result;
}
module.exports.query = query;

function getSql(sql, values) {
    console.log('getSql: ' + sql + ' ' + JSON.stringify(values) );

    let now = new Date();

    for(let i = 0; i < sql_cache.length; i++ ) {
        if (sql_cache[i].sql === sql && JSON.stringify(sql_cache[i].values) === JSON.stringify(values)) {
            if (now < sql_cache[i].expire) {
                console.log('getSql: used cache');
                return sql_cache[i].result;
            }
        }
    }

    return null;
}

function clearSql(sql, values) {
    console.log('clearSql: ' + sql + ' ' + JSON.stringify(values) );
    sql_cache = sql_cache.filter(s => !(s.sql === sql && JSON.stringify(s.values) === JSON.stringify(values)));
}
module.exports.clearSql = clearSql;

function setSql(sql, values, result, expireSeconds) {
    console.log('setSql: ' + sql + ' ' + JSON.stringify(values) );

    // clear old cached css
    sql_cache = sql_cache.filter(s => !(s.sql === sql && JSON.stringify(s.values) === JSON.stringify(values)));

    // cache expires after (expireSeconds) seconds
    let expire = new Date();
    expire.setSeconds(expire.getSeconds() + expireSeconds);

    sql_cache.push({
        sql: sql,
        values: values,
        result: result,
        expire: expire
    })
}