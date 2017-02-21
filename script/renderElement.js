var dateFormat = require('dateformat');

function getTime(time) {
	var datetime = new Date();

	var timeSplit = time.split(":");
	
	datetime.setHours(timeSplit[0]);
	datetime.setMinutes(timeSplit[1]);
	
	var strTime = dateFormat(datetime, "h:MM tt");
	
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
	//var postElement = '';
	var postElement = '<dl>';
	for(var i = 0; i < postdates.length; i++) {
		//postElement += '<blockquote><p>' + postmessages[i] + '</p><footer>' + postusernames[i] + ', ' +  dateFormat(postdates[i], "mmmm dS, yyyy, h:MM:ss TT") + '</footer></blockquote>';
		postElement += '<dt>' + postmessages[i] + '</dt><dd> - ' + postusernames[i] + ', ' +  dateFormat(postdates[i], "mmmm dS, yyyy, h:MM:ss TT") + '</dd>';
	}
	postElement += '</dl>';
	
	webpage = webpage.replace('!%POSTS%!', postElement);
	
	return webpage;
}
module.exports.posts = posts;

function whosgoing(webpage, whosgoing, whosnot) {
	var whosgoingElement = '<ol>';
	var whosnotElement = '<ul>';
	
	for(var i = 0; i < whosgoing.length; i++) {
		whosgoingElement += '<li>' + whosgoing[i] + '</li>';
	}
	whosgoingElement += '</ol>';

	for(var i = 0; i < whosnot.length; i++) {
		whosnotElement += '<li style="color:#CCCCCC">' + whosnot[i] + '</li>';
	}
	whosnotElement += '</ul>';
	
	webpage = webpage.replace('!%WHOSGOING%!',whosgoingElement);
	webpage = webpage.replace('!%NOTATTEND%!', whosnotElement);	
	
	
	return webpage;
}
module.exports.whosgoing = whosgoing;