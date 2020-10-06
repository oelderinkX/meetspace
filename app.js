var express = require('express');
var app = express();
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser')
var cron = require('node-schedule');
var pg = require('pg');
var common = require('./script/common.js');
var port = process.env.PORT || 80

var pool = new pg.Pool(common.postgresConfig());

console.log('port number is: ' + port);

var cronjob = cron.scheduleJob('0 0 */6 * * *', function(fireDate){
	console.log('cron job running...');
	var sql = "SELECT meetspace.reset_activities();"
	pool.connect(function(err, connection, done) {
		connection.query(sql, function(err, result) {
			done();
			if (err) {
				console.error(err);
			}
		});
	});
});

app.use(favicon(__dirname + '/favicon.ico'));

app.disable('etag');

app.use(cookieParser())
app.use('/images', express.static('images'));
app.use('/script', express.static('script'));
app.use('/webpage', express.static('webpage'));
app.use('/javascript', express.static('javascript'));
require('./main.js')(app);

app.listen(port, function () {
	console.log('Reading to meat people!');
});

require('./newactivity.js')(app);
require('./register.js')(app);
require('./useractivate.js')(app);

require('./login.js')(app);
require('./logout.js')(app);

require('./updateprofile.js')(app);

require('./location.js')(app);

require('./activity.js')(app);  //this most likely needs to go at the bottom


