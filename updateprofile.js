var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var renderElement = require('./script/renderElement.js');
var common = require('./script/common.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var updateProfilePage = fs.readFileSync(__dirname + "/webpage/updateprofile.html", "utf8");

module.exports = function(app){
	app.get('/updateprofile', urlencodedParser, function(req, res) {
		updateProfilePage = fs.readFileSync(__dirname + "/webpage/updateprofile.html", "utf8");
		
		var username = req.cookies['username'];
		
		var formatted = updateProfilePage;
		formatted = formatted.replace('!%USERNAME%!', username);
		formatted = formatted.replace('!%ERROR STATUS USERNAME%!', '');
		formatted = formatted.replace('!%ERROR STATUS PASSWORD%!', '');
		
		res.send(formatted);
	});	
	
	app.post('/updateprofile', urlencodedParser, function(req, res) {
		
		var registrationStatus = 'OK';
		/*var insert = 'INSERT INTO meetspace.user (username, password, email, active) ';
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
					
					var formatted = registrationPage;
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
		});
		
		*/
		res.send(updateProfilePage);
	});
}



