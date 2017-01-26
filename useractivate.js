var pg = require('pg');
var querystring = require('querystring');
var common = require('./script/common.js');
var notifications = require('./notifications.js');

var pool = new pg.Pool(common.postgresConfig());

function decode(activationcode) {
	var decoded = querystring.unescape(activationcode);
	
	decoded = new Buffer(decoded, 'base64').toString();
	
	for (var i = 0, len = decoded.length; i < len; i++) {
		decoded = decoded.substr(0, i) + String.fromCharCode((decoded.charCodeAt(i) ^ (12 + i))) + decoded.substr(i+1);
	}		
	
	var decodedSplit = decoded.split(";");
	
	return decodedSplit[1];
}

function encode(email) {
	var encoded = new Buffer('').toString("base64");

	var toEncode = process.hrtime();
	toEncode = toEncode + ';' + email;
	toEncode = toEncode + ';' + process.hrtime();
	var encodedChar = '';

	for (var i = 0, len = toEncode.length; i < len; i++) {
		encodedChar = String.fromCharCode((toEncode.charCodeAt(i) ^ (12 + i)));
		
		toEncode = toEncode.substr(0, i) + encodedChar + toEncode.substr(i+1);
	}
	
	encoded = new Buffer(toEncode).toString("base64"); 
	
	encoded = querystring.escape(encoded);
	
	return encoded;
}

module.exports = function(app){
	///
	/// This function will eventually send out emails but at the moment its just generating a potential activation key
	///	
    app.get('/getactivationcode/:email', function(req, res){
		var email = req.params.email;
		var response = '<html><body>';

		pool.connect(function(err, client, done) {
			var sql = "SELECT email FROM meetspace.user WHERE active = false AND email = '" + email +  "' LIMIT 1;";
			client.query(sql, function(err, result) {
				done();
				
				console.log('active sql: ' + sql);
				console.log('active result: ' + result);
				
				if (result && result.rows[0]) {
					var encodedEmail = encode(result.rows[0].email);

					notifications.sendRegistrationEmail(email, encodedEmail);
					
					response += 'An email has been sent to your email account with activation details.  Click <a href="http://meetspace.co.nz/login">here</a> to access the login page after you have registered.<br/><br/>';
				} else {
					response = response + 'You are attempting to activate an invalid user';
				}
				
				response = response + '</body></html>';
				
				res.send(response);
			});
		});
    });
	
	///
	/// This function updates the users active field to true
	///	
	app.get('/useractivate/:activationcode', function(req, res) {
		var activationCode = req.params.activationcode;
		var response = '<html><body>';
		var email = '';

		try {
			email = decode(activationCode);
		
			pool.connect(function(err, client, done) {
				client.query('UPDATE meetspace.user SET active = true WHERE email = ? AND active = true;', [email], function(err, result) {
					done();

					response = response + 'Email ' + email + ' has been activivated.  Please proceed to <a href="/login">login page</a>';
				
					response = response + '</body></html>';
					res.send(response);
				});
			});
		} catch (err) {
			console.log(err);
			response = response + 'Invalid activation code';
			
			response = response + '</body></html>';
			res.send(response);
		}
	});
}