var pg = require('pg');
var bodyParser = require('body-parser');
var fs = require("fs");
var common = require('./script/common.js');
var renderElement = require('./script/renderElement.js');
var notifications = require('./notifications.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });
var jsonParser = bodyParser.json();

var pool = new pg.Pool(common.postgresConfig());

var style1Page = fs.readFileSync(__dirname + "/webpage/activity_style1.html", "utf8");
var listPage = fs.readFileSync(__dirname + "/webpage/activity_list.html", "utf8");
var infoPage = fs.readFileSync(__dirname + "/webpage/infopage.html", "utf8");

function getUrl(country, region, city, game) {
	var url = common.webpage_url;

	url += country + '/' + region + '/' + city + '/' + game;

	return url;
}

function renderPage(country, region, city, game, req, res) {
	var email = req.cookies['email'];

	var webpage = style1Page;

	var username = req.cookies['username'];
	var sessionId = req.cookies['sessionId'];
	
	var action = req.body.action;

	getUrl(country, region, city, game);

	webpage = renderElement.login(webpage, username, common.webpage_url);

	webpage = renderElement.breadcrumb(webpage, country, region, city, game);

	var sql = "SELECT * FROM meetspace.find_activity($1, $2, $3, $4);"

	pool.connect(function(err, client, done) {
		if(err) {
			console.log("ERROR! " + err);
		}

		client.query(sql, [country, region, city, game], function(err, result) {
			done();

			if (err) {
				console.log("errors!");
			} else {
				if (result.rows.length == 1) {
					var showjoin = 'none';
					var showunjoin = 'none';
					var showattend = 'none';
					var showunattend = 'none';
					var showreset = 'none';
					var showchannel = 'none';
					var showpost = 'none';
					var showinvite = 'none';
					var showdelete = false;
					var showedit = 'none';
					var actionlink = '/' + country;
					if (region) {
						actionlink += '/' + region;
					}
					actionlink += '/' + city;
					actionlink += '/' + game;

					var activityId = result.rows[0].ret_activityid;
					var title = result.rows[0].ret_title;
					var time = result.rows[0].ret_time;
					var day = result.rows[0].ret_day;
					game = result.rows[0].ret_game;
					description = result.rows[0].ret_description;

					sql = "SELECT * FROM meetspace.get_activity_details($1, $2, $3);"

					pool.connect(function(err, client, done) {
						if (err) {
							console.log("ERROR: " + err);
						}

						client.query(sql, [email, sessionId, activityId], function(err, result) {
							done();

							if (err) {
								console.log("error fail");
							} else {
								var isJoined = result.rows[0].ret_joined;
								var isAttending = result.rows[0].ret_attended;
								var isAdmin = result.rows[0].ret_admin;
							
								if (isJoined) {
									showunjoin = '';
									showpost = 'inline';
									showinvite = 'inline';
									showchannel = 'inline';

									if (isAttending) {
										showunattend = 'inline';
									} else {
										showattend = 'inline';
									}
									
									if (isAdmin) {
										showreset = 'inline';
										showedit = 'inline';
										showreset = 'inline';
										
										if (action == 'editmode') {
											showdelete = true;
										}
									}
								} else {
									if (username && sessionId) {
										showjoin = '';
										showchannel = 'inline';
									}
								}

								webpage = renderElement.activityTitle(webpage, title);
								webpage = renderElement.activityTime(webpage, day, time);
								webpage = webpage.replace('!%DESCRIPTION%!', description);
								webpage = common.replaceAll(webpage, '!%ACTION%!', actionlink);
								webpage = common.replaceAll(webpage, '!%ACTIVITYID%!', activityId);

								webpage = common.replaceAll(webpage, '!%SHOWJOIN%!', showjoin);
								webpage = common.replaceAll(webpage, '!%SHOWUNJOIN%!', showunjoin);
								webpage = common.replaceAll(webpage, '!%SHOWATTEND%!', showattend);
								webpage = common.replaceAll(webpage, '!%SHOWUNATTEND%!', showunattend);
								//webpage = common.replaceAll(webpage, '!%SHOWRESET%!', showreset);
								webpage = common.replaceAll(webpage, '!%SHOWEDIT%!', showedit);
								webpage = common.replaceAll(webpage, '!%SHOWCHANNEL%!', showchannel);

								webpage = webpage.replace('!%SHOWPOST%!', showpost);
								webpage = webpage.replace('!%SHOWINVITE%!', showinvite);

								res.cookie('activity' , actionlink);

								res.send(webpage);
							}
						});
					});
				} else if (result.rows.length == 0) {
					var noactivityPage = infoPage;

					if (game) {
						var message = 'No activty for ' + game + '.  Would you like to create it? <a href="/newactivity" class="btn btn-primary" role="button">Create</a>';
						noactivityPage = noactivityPage.replace('!%MESSAGE%!', message);
					} else {
						var message = 'No activties in your area.  Would you like to create one? <a href="/newactivity" class="btn btn-primary" role="button">Create</a>';
						//diagnostics start
						//message += '<br/>country: "' + country + '"';
						//message += '<br/>region: "' + region + '"';
						//message += '<br/>city: "' + city + '"';
						//message += '<br/>game: "' + game + '"';
						//diagnostics end
						noactivityPage = noactivityPage.replace('!%MESSAGE%!', message);
					}

					res.send(noactivityPage);
				} else if (result.rows.length > 1) {
					webpage = listPage;

					webpage = renderElement.breadcrumb(webpage, country, region, city, game);

					var titlelist = [];
					var gamelist = [];
					var citylist = [];
					var regionlist = [];
					var countrylist = [];
					var descriptionlist = [];
					var linklist = [];
					var numberofplayerslist = [];

					for (var i = 0; i < result.rows.length; i++) {
						var title = result.rows[i].ret_title;
						game = result.rows[i].ret_game;
						city = result.rows[i].ret_city;
						region = result.rows[i].ret_region;
						country = result.rows[i].ret_country;
						description = result.rows[i].ret_description;
						var numberofplayers = result.rows[i].ret_number_of_players;

						var link = getUrl(country, region, city, game);

						titlelist.push(title);
						gamelist.push(game);
						citylist.push(city);
						regionlist.push(region);
						countrylist.push(country);
						descriptionlist.push(description);
						linklist.push(link);
						numberofplayerslist.push(numberofplayers);
					}

					webpage = renderElement.activities(webpage, titlelist, gamelist, citylist, regionlist, countrylist, descriptionlist, linklist, numberofplayerslist);

					res.send(webpage);
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
		} else if (action == 'announce') {
			sql = "select * FROM meetspace.get_emails_for_activity('" + email + "', '" + sessionId + "', " + activityId + ");";

			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();

					for (var i = 0; i < result.rows.length; i++) {
						var toEmail = result.rows[i].ret_email;
						var activityTitle = result.rows[i].ret_activitytitle;

						notifications.sendPostEmail(toEmail, username, activityTitle, getUrl(country, region, city, game), req.body.postTitle, req.body.postmessage);
					}
					
					sql = "SELECT meetspace.post_message($1, $2, $3, $4, $5);";

					pool.connect(function(err, client, done) {
						client.query(sql, [ email, sessionId, activityId, req.body.postmessage, req.body.postTitle], function(err, result) {
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
		} else if (action == 'removefromactivity') {
			var remove_email = req.body.remove_email;
			
			sql = "select * FROM meetspace.remove_from_activity('" + remove_email + "', '" + sessionId + "', " + activityId + ");";

			pool.connect(function(err, client, done) {
				client.query(sql, function(err, result) {
					done();
					
					console.log(err);

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

		var country = undefined;
		var city = undefined;
		var region = undefined;
		var game = undefined;

		if (params.length > 1) {
			if (params[1] !== null && params[1] !== '') {
				country = params[1];
			}
		}

		if (params[2] !== null && params[2] !== '') {
			region = params[2];
		}

		if (params[3] !== null && params[3] !== '') {
			city = params[3];
		}
		
		if (params[4] !== null && params[4] !== '') {
			game = params[4];
		}

		console.log('country: ' + country );
		console.log('region: ' + region );
		console.log('city: ' + city);
		console.log('game: ' + game);
		
		renderPage(country, region, city, game, req, res);
	});

	app.post('/getposts', jsonParser, function(req, res) {
		var activityId = req.body.activityId;

		var postsql = "SELECT username, message, postdate, title FROM meetspace.post INNER JOIN meetspace.user ON meetspace.post.userid = meetspace.user.id WHERE activityid = $1 ORDER BY postdate DESC LIMIT 10;";

		pool.connect(function(err, client, done) {
			client.query(postsql, [activityId], function(err, result) {
				done();
				
				var posts = [];

				if (result) {
					for (var i = 0; i < result.rows.length; i++) {
						posts.push({
						  username: result.rows[i].username,
						  message: result.rows[i].message,
						  title: result.rows[i].title,
						  submissionDate: result.rows[i].postdate
						});
					}
				}

				res.send(posts);
			});
		});
	});

	app.post('/whosgoing', jsonParser, function(req, res) {
		var activityId = req.body.activityId;

		var whosgoingsql = "SELECT meetspace.user.email, meetspace.user.username, meetspace.whosgoing.status";
		whosgoingsql += " FROM meetspace.whosgoing JOIN meetspace.user ON meetspace.whosgoing.userId = meetspace.user.id";
		whosgoingsql += " WHERE meetspace.whosgoing.activityId = " + activityId;

		pool.connect(function(err, client, done) {
			client.query(whosgoingsql , function(err, result) {
				done();

				var whosgoing = [];

				for (var i = 0; i < result.rows.length; i++) {
					//var email = result.rows[i].email;
					var username = result.rows[i].username;
					var status = result.rows[i].status;

					whosgoing.push({ username: username, status: status });
				}

				res.send(whosgoing);
			});
		});
	});

	app.post('/postmessage', jsonParser, function(req, res) {
		var activityId = req.body.activityId;
		var message = req.body.message;
		var email = req.cookies['email'];
		var sessionId = req.cookies['sessionId'];

		sql = "SELECT meetspace.post_message($1, $2, $3, $4);";

		pool.connect(function(err, client, done) {
			client.query(sql, [ email, sessionId, activityId, message], function(err, result) {
				res.send({ success: true});
			});
		});
	});
}
