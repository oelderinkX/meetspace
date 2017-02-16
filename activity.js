var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var common = require('./script/common.js');
var notifications = require('./notifications.js');
var dateFormat = require('dateformat');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var pool = new pg.Pool(common.postgresConfig());

var style1Page = fs.readFileSync(__dirname + "/webpage/activity_style1.html", "utf8");

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

function getUrl(country, region, city, game) {
	var url = common.webpage_url;
	
	if (region) {
		url += country + '/' + region + '/' + city + '/' + game;
	} else {
		url += country + '/' + city + '/' + game;
	}
	
	return url;
}

function renderPage(country, region, city, game, req, res) {
	//var email = req.cookies['email'];
	//var sessionId = req.cookies['sessionId'];

	var webpage = style1Page;
	
	var username = req.cookies['username'];
	var sessionId = req.cookies['sessionId'];
	
	var loginForm = '<form action="' + common.webpage_url + 'login"><input type="submit" value="Login" /></form>';
	var logoutForm = '<form action="' + common.webpage_url + 'logout">' + username + ' <input type="submit" value="Logout" /></form>';
	
	getUrl(country, region, city, game);
	
	if (username) {
		webpage = webpage.replace('!%LOGIN%!', logoutForm);
	} else {
		webpage = webpage.replace('!%LOGIN%!', loginForm);
	}
	
	var sql = 'SELECT activityId, title, game, city, region, country, time, day, styleid, description FROM meetspace.activity';
	
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
					var disabled = 'disabled';
					var showpost = 'none'; 
					var showinvite = 'none'; 
					
					game = result.rows[0].game;
					description = result.rows[0].description;
					var actionlink = '/' + country;
					if (region) {
						actionlink += '/' + region;
					}
					actionlink += '/' + city;
					actionlink += '/' + game;
					
					if (username && sessionId) {
						disabled = '';
						showpost = 'inline';
						showinvite = 'inline';
					}
					
					webpage = webpage.replace('!%TITLE%!', title + ', ' + getDay(day) + ' ' + getTime(time));
					webpage = webpage.replace('!%DESCRIPTION%!', description);
					webpage = common.replaceAll(webpage, '!%ACTION%!', actionlink);
					webpage = common.replaceAll(webpage, '!%ACTIVITYID%!', activityId);
										
					webpage = common.replaceAll(webpage, '!%DISABLED%!', disabled);
					
					webpage = webpage.replace('!%SHOWPOST%!', showpost);
					webpage = webpage.replace('!%SHOWINVITE%!', showinvite);
					
					res.cookie('activity' , actionlink);
					
					var whosgoingsql = "SELECT meetspace.user.username, meetspace.whosgoing.status FROM meetspace.whosgoing JOIN meetspace.user ON meetspace.whosgoing.userId = meetspace.user.id WHERE meetspace.whosgoing.activityId = " + activityId;
					
					pool.connect(function(err, client, done) {
						client.query(whosgoingsql , function(err, result) {
							done();
							
							var whosgoinglist = '';
							var notattendinglist = '';
							
							if (!result) {
								webpage = webpage.replace('!%WHOSGOING%!', 'No body');
							} else {
								for (var i = 0; i < result.rows.length; i++) {
									var username = result.rows[i].username;
									var status = result.rows[i].status;
									
									if (status == 1) {
										whosgoinglist += '<li>' + username + '</li>';
									} else {
										notattendinglist += '<li style="color:#CCCCCC">' + username + '</li>';
									}
								}
								
								webpage = webpage.replace('!%WHOSGOING%!', '<ul>' + whosgoinglist);
								webpage = webpage.replace('!%NOTATTEND%!', notattendinglist + '</ul>');
							}

							var posts = '';
							var postsql = "SELECT username, message, postdate FROM meetspace.post INNER JOIN meetspace.user ON meetspace.post.userid = meetspace.user.id WHERE activityid = $1 ORDER BY postdate DESC;";
							
							pool.connect(function(err, client, done) {
								client.query(postsql, [activityId], function(err, result) {
									done();
							
									if(!result) {
										posts = '';
									} else {
										for (var i = 0; i < result.rows.length; i++) {
											var postusername = result.rows[i].username;
											var postmessage = result.rows[i].message;
											var postdate = result.rows[i].postdate;
											
											posts += dateFormat(postdate, "mmmm dS, yyyy, h:MM:ss TT") + ' ' + postusername + ' wrote: ' + postmessage + '<br/>';
										}
									}
							
									webpage = webpage.replace('!%POSTS%!', posts);
							
									res.send(webpage);
								});
							});
						});
					});
				} else if (result.rows.length == 0) {
					var details = '';
					
					if (game) {
						details += 'no activty for ' + game + '.  Would you like to create it?';
					} else {
						details += 'no activties in your area';
					}
					details += '</body></html>';
					res.send(details);
				} else if (result.rows.length > 1) {
					var details = 'Activities in your area:<br/><br/>';
					
					for (var i = 0; i < result.rows.length; i++) {
						var title = result.rows[i].title
						game = result.rows[i].game;
						city = result.rows[i].city;
						region = result.rows[i].region;
						country = result.rows[i].country;
						description = result.rows[i].description;
						
						var link = getUrl(country, region, city, game);
						
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
	var email = req.cookies['email'];
	var sessionId = req.cookies['sessionId'];
	var username = req.cookies['username'];
	var sql = '';
	
	var activityId = req.body.activityId;
	console.log('activityId:' + activityId);
	
	if (action) {
		if (action == 'join') {
			sql = "SELECT meetspace.join_activity('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			console.log('sql: ' + sql);
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});
		} else if (action == 'unjoin') {
			sql = "SELECT meetspace.unjoin_activity('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});			
		} else if (action == 'attend') {
			sql = "SELECT meetspace.attend_activity('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});	
		} else if (action == 'unattend') {
			sql = "SELECT meetspace.unattend_activity('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});
		} else if (action == 'post') {
			sql = "select * FROM meetspace.get_emails_for_activity('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();

					for (var i = 0; i < result.rows.length; i++) {
						var toEmail = result.rows[i].ret_email;
						var activityTitle = result.rows[i].ret_activitytitle;
					
						notifications.sendPostEmail(toEmail, username, activityTitle, req.body.postmessage);
					}
					
					sql = "SELECT meetspace.post_message($1, $2, $3, $4);";

					pool.connect(function(err, client, done) {
						client.query(sql, [ email, sessionId, activityId, req.body.postmessage], function(err, result) {
							renderPage(country, region, city, game, req, res);
						});
					});
				});
			});		
		} else if (action == 'invite') {
			sql = "select * FROM meetspace.check_credentials('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
				
					if (result && result.rows && result.rows.length == 1) {
						var isValid = result.rows[0].ret_valid;
						var activityTitle = result.rows[0].ret_title;
					
						if (isValid) {
							notifications.sendInviteEmail(req.body.toemail, getUrl(country, region, city, game), activityTitle);
						}
					}
					
					renderPage(country, region, city, game, req, res);
				});
			});				
		} else if (action == 'reset') {
			sql = "select * FROM meetspace.reset_acitivty('" + email + "', '" + sessionId + "', " + activityId + ");";
			
			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					renderPage(country, region, city, game, req, res);
				});
			});
		} else {
			renderPage(country, region, city, game, req, res);
		}
		
	} else {
		renderPage(country, region, city, game, req, res);
	}
}

module.exports = function(app) {
    app.get('*', urlencodedParser, function(req, res) {
		var url = req.url;
		var params = url.split("/");
		
		var country = '';
		var city = '';
		var region = '';
		var game = '';

		if (params.length > 1) {
			country = params[1];
		}
		
		if(country == 'usa') {
			region = params[2];
			city = params[3];
			game = params[4];
		} else {
			city = params[2];
			game = params[3];
		}
		
		renderPage(country, region, city, game, req, res);
    });
	
   app.post('*', urlencodedParser, function(req, res) {
		var action = req.body.action;
	
		var url = req.url;
		var params = url.split("/");
		
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