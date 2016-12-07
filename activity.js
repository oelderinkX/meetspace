var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
//var constant = require('./script/constant.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var config = {
  host: 'ec2-54-235-111-59.compute-1.amazonaws.com',
  user: 'qpidruggfishtd',
  database: 'df8uavpng011op',
  password: '2RgFbHtlj9eQO8MRwP48Vi_NFV',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000
};

var pool = new pg.Pool(config);

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
		
		var sql = 'SELECT activityId, title, game, city, region, country, time, day, description FROM meetspace.activity';
		
		sql = addWhereClause(sql, 'country', country);
		sql = addWhereClause(sql, 'region', region);
		sql = addWhereClause(sql, 'city', city);
		sql = addWhereClause(sql, 'game', game);
		
		sql += ' LIMIT 10';
		
		console.log(sql);
		
		pool.connect(function(err, client, done) {
			
			if(err) {
				console.log("ERROR! " + err)
			}
			
			client.query(sql, function(err, result) {
				done();
				
				if (err) {
					console.log("errors!");
				} else {
					if (result.rows.length == 1) {
						var title = result.rows[0].title;
						var datetime = result.rows[0].time;
						var day = result.rows[0].day;
						var activityId = result.rows[0].activityId;
						
						game = result.rows[0].game;
						description = result.rows[0].description;
						details += '<h2>' + title + ', ' + getDay(day) + ' ' + getTime(datetime) + '</h2>';
						details += '' + description + '';
						
						
						var whosgoingsql = "SELECT user.username FROM meetspace.whosgoing JOIN meetspace.user ON whosgoing.userId = user.id WHERE whosgoing.activityId = ?"
						pool.connect(function(err, client, done) {
							client.query(whosgoingsql, [activityId], function(err, result) {
								connection.release();
								
								details += '<br/><br/>Whos going:<br/><br/>';
								
								if (result.rows.length == 0) {
									details += 'Nobody';
								} else {
									for (var i = 0; i < result.rows.length; i++) {
										var username = result.rows[i].username;
										details +=  username + '<br/>';
									}
								}

								details += '</body></html>';
								res.send(details);
							});
						});
						
					} else if (result.rows.length == 0) {
						//display 'would you like to create'
						details += 'no activty for ' + game + '.  Would you like to create it?';
						details += '</body></html>';
						res.send(details);
					} else if (result.rows.length > 1) {
						
						details += 'Activities in your area:<br/><br/>';
						
						for (var i = 0; i < result.rows.length; i++) {
							var title = result.rows[i].title
							game = result.rows[i].game;
							city = result.rows[i].city;
							region = result.rows[i].region;
							country = result.rows[i].country;
							description = result.rows[i].description;
							
							var link = 'https://meetspacev1.herokuapp.com/';
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