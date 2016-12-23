var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var common = require('./script/common.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

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

function getTime(time) {
	var strTime = time;
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

function renderPage(country, region, city, game, res) {
	var details = details = '<html><body>';
	
	var sql = 'SELECT activityId, title, game, city, region, country, time, day, description FROM meetspace.activity';
	
	sql = addWhereClause(sql, 'country', country);
	sql = addWhereClause(sql, 'region', region);
	sql = addWhereClause(sql, 'city', city);
	sql = addWhereClause(sql, 'game', game);
	
	sql += ' LIMIT 10';
	
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
					var time = result.rows[0].time;
					var day = result.rows[0].day;
					var activityId = result.rows[0].activityid;
					
					game = result.rows[0].game;
					description = result.rows[0].description;
					details += '<h2>' + title + ', ' + getDay(day) + ' ' + getTime(time) + '</h2>';
					details += '' + description + '';
					
					
					var whosgoingsql = "SELECT meetspace.user.username FROM meetspace.whosgoing JOIN meetspace.user ON meetspace.whosgoing.userId = meetspace.user.id WHERE meetspace.whosgoing.activityId = " + activityId;
					
					console.log('sql:' + whosgoingsql);
					console.log('activityyId:' + activityId);
					
					pool.connect(function(err, client, done) {
						var itrun = client.query(whosgoingsql , function(err, result) {
							done();
							
							details += '<br/><br/>Whos going:<br/><br/>';
							
							console.log(itrun);
							
							if (!result) {
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
}

function performAction(country, region, city, game, action, req, res) {
	//var email = req.cookies['email'];
	//var sessionId = req.cookies['sessionId'];
	
	
	if (action) {
		if (action == 'join') {
			sql = 'insert into meetspace.whosgoing (activityid, userid) values (1,1);';
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, res);
				});
			});
		} else {
			renderPage(country, region, city, game, res);
		}
	} else {
		console.log('do NOT action');
		renderPage(country, region, city, game, res);
	}
}

module.exports = function(app) {
    app.get('*', function(req, res) {
		var action = req.param('action');
		
		var url = req.url;
		var fullurl = url.split("?");
		
		if (fullurl && fullurl.length > 0) {
			var params = fullurl[0].split("/");
		}
		
		var country = '';
		var city = '';
		var region = '';
		var game = '';
		
		if(params.length === 4) {
			country = params[1];
			city = params[2];
			game = params[3];
		} else if (params.length === 5) {
			country = params[1];
			region = params[2];
			city = params[3];
			game = params[4];
		} else {
			//details = 'unknown activity';
			//res.send(details);
		}
		
		performAction(country, region, city, game, action, req, res);
    });
}