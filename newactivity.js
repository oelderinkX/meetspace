var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var renderElement = require('./script/renderElement.js');
var common = require('./script/common.js');
var location = require('./location.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var newActivityPage = fs.readFileSync(__dirname + "/webpage/newactivity.html", "utf8");

module.exports = function(app){
	app.get('/newactivity', function(req, res) {
		newActivityPage = fs.readFileSync(__dirname + "/webpage/newactivity.html", "utf8");
		
		var formatted = newActivityPage;
		formatted = formatted.replace('!%ACTIVITYNAME%!', '');
		formatted = formatted.replace('!%ACTIVITYTITLE%!', '');
		formatted = formatted.replace('!%ACTIVITYDESCRIPTION%!', '');
		
		formatted = formatted.replace('!%ERROR STATUS%!', '');
	
		res.send(formatted);
	});	
	
	app.post('/newactivity', urlencodedParser, function(req, res) {
		var email = req.cookies['email'];
		var sessionId = req.cookies['sessionId'];

		var title = req.body.activitytitle;
		var activity_name = req.body.activityname;
		var city = req.body.city;
		var region_id = req.body.region;
		var country = req.body.country;
		if (country.includes(','))
		{
			country = country.split(',')[1];
		}
		var description = req.body.activitydescription;
		var hour = req.body.hour;
		var minute = req.body.minute;
		if (req.body.ampm == "PM")
		{
			hour = (+hour) + 12;
		}
		var time = hour + ':' + minute;
		var day = req.body.day;
		var public = req.body.public;

		var sql = 'SELECT meetspace.create_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)';
		pool.connect(function(err, connection, done) {
			connection.query(sql, [email, sessionId, title, activity_name, city, region_id, country, description, time, day, public], function(err, result) {
				connection.release();
				
				if (err) {
					console.error(err);
					res.send(err);
				} else {
					var game_url = result.rows[0].ret_game_url;

					res.redirect('/' + game_url);
				}
			});
		});
	});
}



