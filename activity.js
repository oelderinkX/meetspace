var mysql = require('mysql');
var bodyParser = require('body-parser');
var fs = require("fs");
//var constant = require('./script/constant.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'oelderink',
  database : 'meetspace'
});

function addWhereClause(sql, fieldName, fieldValue) {
	var newSql = sql;
	
	if(fieldValue) {
		if (newSql.includes("WHERE")) {
			newSql += ' AND ' + fieldName + '= \'' + fieldValue + '\'';
		} else {
			newSql += ' WHERE ' + fieldName + '= \'' + fieldValue + '\'';
		}
	}
	
	return newSql;
}

function getTime(datetime) {
	var hours = datetime.getHours();
	var minutes = datetime.getMinutes();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
}

function getDay(day) {
	if (day == 0) {
		return "Sunday";
	} else if (day == 1) {
		return "Monday";
	} else if (day == 2) {
		return "Tuesday";
	} else if (day == 3) {
		return "Wednesday";
	} else if (day == 4) {
		return "Thursday";
	} else if (day == 5) {
		return "Friday";
	} else {
		return "Saturday";
	}
}

module.exports = function(app) {
    app.get('*', function(req, res) {
		var url = req.url;
		var params = url.split("/");
		
		var country = '';
		var city = '';
		var region = '';
		var game = '';
		
		var details = details = '<html><body>';
		
		if(params.length === 4) {
			country = params[1];
			city = params[2];
			game = params[3];
			
			//details += 'Country: ' + country + '<br/>';
			//details += 'City: ' + city  + '<br/>';
			//details += 'Game: ' + game  + '<br/>';
		} else if (params.length === 5) {
			country = params[1];
			region = params[2];
			city = params[3];
			game = params[4];
			
			//details += 'Country: ' + country + '<br/>';
			//details += 'Region: ' + region  + '<br/>';
			//details += 'City: ' + city  + '<br/>';
			//details += 'Game: ' + game  + '<br/>';
			//details += '<br/>';
		} else {
			//details = 'unknown activity';
			//res.send(details);
		}
		
		var sql = 'SELECT activityId, title, game, city, region, country, time, day, description FROM activity';
		
		sql = addWhereClause(sql, 'country', country);
		sql = addWhereClause(sql, 'region', region);
		sql = addWhereClause(sql, 'city', city);
		sql = addWhereClause(sql, 'game', game);
		
		sql += ' LIMIT 10';
		
		console.log(sql);
		
		pool.getConnection(function(err, connection) {
			connection.query(sql, function(err, rows) {
				connection.release();
				
				if (err) {
					console.log("errors!");
				} else {
					if (rows.length == 1) {
						var title = rows[0].title;
						var datetime = rows[0].time;
						var day = rows[0].day;
						var activityId = rows[0].activityId;
						
						game = rows[0].game;
						description = rows[0].description;
						details += '<h2>' + title + ', ' + getDay(day) + ' ' + getTime(datetime) + '</h2>';
						details += '' + description + '';
						
						
						var whosgoingsql = "SELECT user.username FROM whosgoing JOIN user ON whosgoing.userId = user.id WHERE whosgoing.activityId = ?"
						pool.getConnection(function(err, connection) {
							connection.query(whosgoingsql, [activityId], function(err, rows) {
								connection.release();
								
								details += '<br/><br/>Whos going:<br/><br/>';
								
								if (rows.length == 0) {
									details += 'Nobody';
								} else {
									for (var i = 0; i < rows.length; i++) {
										var username = rows[i].username;
										details +=  username + '<br/>';
									}
								}

								details += '</body></html>';
								res.send(details);
							});
						});
						
					} else if (rows.length == 0) {
						//display 'would you like to create'
						details += 'no activty for ' + game + '.  Would you like to create it?';
						details += '</body></html>';
						res.send(details);
					} else if (rows.length > 1) {
						
						details += 'Activities in your area:<br/><br/>';
						
						for (var i = 0; i < rows.length; i++) {
							var title = rows[i].title
							game = rows[i].game;
							city = rows[i].city;
							region = rows[i].region;
							country = rows[i].country;
							description = rows[i].description;
							
							var link = 'http://www.meetspace.com/';
							if (region) {
								link += country + '/' + region + '/' + city + '/' + game;
							} else {
								link += country + '/' + city + '/' + game;
							}
							
							details += title + ' <a href="' + link + '">' + link + '</a><br/>';
						}
						
						details += '</body></html>';
						res.send(details);
					}
				}
			});
		});
    });
}