var mysql = require('mysql');
var querystring = require('querystring');

var pool = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'oelderink',
  database : 'meetspace'
});

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

		pool.getConnection(function(err, connection) {
			connection.query('SELECT email FROM user WHERE active = false AND email = ? LIMIT 1;', [email], function(err, rows, fields) {
				connection.release();
				
				if (rows[0]) {
					var encodedEmail = encode(rows[0].email);
					var encodedEmail = '';
			
					response = response + 'Your activation link is: <a href="/activate/' + encodedEmail + '">Activate</a><br/><br/>email: ' + decode(encodedEmail) + '<br/>encoded: ' + encodedEmail;
				} else {
					response = response + 'Invalid user';
				}
				
				response = response + '</body></html>';
				
				res.send(response);
			});
		});
    });
	
	///
	/// This function updates the users active field to true
	///	
	app.get('/activate/:activationcode', function(req, res) {
		var activationCode = req.params.activationcode;
		var response = '<html><body>';
		var email = '';

		try {
			email = decode(activationCode);
		
			pool.getConnection(function(err, connection) {
				connection.query('UPDATE user SET active = true WHERE email = ? AND active = false;', [email], function(err, rows, fields) {
					connection.release();

					response = response + 'Email ' + email + ' activivated.';
				
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