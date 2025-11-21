const express = require('express');
const app = express();
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser')
const cron = require('node-schedule');
const pg = require('pg');
const common = require('./script/common.js');
const port = process.env.PORT || 80

const pool = new pg.Pool(common.postgresConfig());
console.log('port number is: ' + port);

const cronjob = cron.scheduleJob('0 0 */6 * * *', function(fireDate){
	console.log('cron job running...');
	const sql = "SELECT meetspace.reset_activities();"
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
app.use('/google9ca0afca288aa353.html', express.static(__dirname + '/google/google9ca0afca288aa353.html'));

app.disable('etag');

app.use(cookieParser())
app.use('/images', express.static('images'));
app.use('/postimages', express.static('postimages'));
app.use('/script', express.static('script'));
app.use('/webpage', express.static('webpage'));
app.use('/javascript', express.static('javascript'));
require('./main.js')(app);

app.listen(port, function () {
	console.log('Ready to meat people!');
});

require('./newactivity.js')(app);
require('./register.js')(app);
require('./forgotpassword.js')(app);
require('./useractivate.js')(app);

require('./login.js')(app);
require('./logout.js')(app);

require('./updateprofile.js')(app);

require('./location.js')(app);

require('./activity.js')(app);  //this most likely needs to go at the bottom
