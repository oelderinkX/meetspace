var dateFormat = require('dateformat');

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

function activityTitle(webpage, title, day, time) {
  
  webpage = webpage.replace('!%TITLE%!', title + ', ' + getDay(day) + ' ' + getTime(time));
  
  return webpage;
}
module.exports.activityTitle = activityTitle;

function posts(webpage, postdates, postusernames, postmessages) {
	var postElement = '';
	for(var i = 0; i < postdates.length; i++) {
		postElement += dateFormat(postdates[i], "mmmm dS, yyyy, h:MM:ss TT") + ' ' + postusernames[i] + ' wrote: ' + postmessages[i] + '<br/><br/>';
	}
	
	webpage = webpage.replace('!%POSTS%!', postElement);
	
	return webpage;
}
module.exports.posts = posts;