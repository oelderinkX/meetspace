var mysql = require('mysql');
var bodyParser = require('body-parser');
var fs = require("fs");

var urlencodedParser = bodyParser.urlencoded({ extended: false });

const connectionString = process.env.DATABASE_URL;

var pool = new pg.Pool(connectionString);

var registrationPage = fs.readFileSync(__dirname + "/webpage/registration.html", "utf8");

module.exports = function(app){
	app.get('/register', function(req, res) {
		registrationPage = fs.readFileSync(__dirname + "/webpage/registration.html", "utf8");
		
		var formatted = registrationPage;
		formatted = formatted.replace('!%USERNAME%!', '');
		formatted = formatted.replace('!%PASSWORD%!', '');
		formatted = formatted.replace('!%EMAIL%!', '');
		
		formatted = formatted.replace('!%ERROR STATUS%!', '');
		
		res.send(formatted);
	});	
	
	app.post('/register', urlencodedParser, function(req, res) {
		
		var registrationStatus = 'OK';
		var insert = 'INSERT INTO user (username, password, email, active) ';
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
					
					formatted = formatted.replace('!%ERROR STATUS%!',errorMessage);
					
					res.send(formatted);
				} else {
					res.redirect('/getactivationcode/' + email);
				}
			});
		});
	});
}



