function logDbStats(msg, pool) {
    if (log) {
        if (pool) {
            console.log(msg);
            console.log(`pg.Pool.totalCount: ${pool.totalCount}`);
            console.log(`pg.Pool.idleCount: ${pool.idleCount}`);
            console.log(`pg.Pool.waitingCount: ${pool.waitingCount}`);
        }
    }
}
module.exports.logDbStats = logDbStats;