var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var renderElement = require('./script/renderElement.js');
var common = require('./script/common.js');

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
		
		var allCountries = '<option value="newzealand">New Zealand</option>';
		var allCountries += '<option value="australia">Australia</option>';
		
		formatted = formatted.replace('!%COUNTRIES%!', allCountries);
		
		formatted = formatted.replace('!%ERROR STATUS%!', '');
		
		res.send(formatted);
	});	
	
	app.post('/newactivity', urlencodedParser, function(req, res) {
		var html = req.body.activityname + '<br/>';
		html += req.body.activitytitle + '<br/>';
		html += req.body.day + '<br/>';
		html += req.body.hour + '<br/>';
		html += req.body.minute + '<br/>';
		html += req.body.ampm + '<br/>';
		html += req.body.activitydescription + '<br/>';
		html += req.body.activitypublic + '<br/>';
		html += req.body.activityprivate + '<br/>';
		
		res.send(html);
		
		
		/*var registrationStatus = 'OK';
		var insert = 'INSERT INTO meetspace.user (username, password, email, active) ';
		insert = insert + 'VALUES($1,$2,$3,false);';
		
		var username = req.body.username;
		var password = req.body.password;
		var email = req.body.email;
		
		console.log(insert);
		
		pool.connect(function(err, connection, done) {
			connection.query(insert, 
						[ username,
						password,
						email],
						function(err) {
				connection.release();
				
				if (err) {
					console.error(err);
					var errAsString = err.toString();
					var errorMessage = 'Unknown error occured when created user.  Please try again.';
					
					if (errAsString.indexOf('Duplicate') > 0 && errAsString.indexOf('email') > 0) {
						errorMessage = 'Email address already taken.  Please choose another';
					}
					
					var formatted = newActivityPage;
					formatted = formatted.replace('!%USERNAME%!', username);
					formatted = formatted.replace('!%PASSWORD%!', password);
					formatted = formatted.replace('!%EMAIL%!', email);
					
					//formatted = formatted.replace('!%ERROR STATUS%!',errorMessage);
					formatted = renderElement.error(formatted, errorMessage);
					
					res.send(formatted);
				} else {
					res.redirect('/getactivationcode/' + email);
				}
			});
		});*/
	});
}



