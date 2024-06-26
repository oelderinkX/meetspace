var helper = require('sendgrid').mail;
var from_email = new helper.Email('meetspace.noreply@gmail.com');

const sgMail = require('@sendgrid/mail') //new code
sgMail.setApiKey(process.env.SENDGRID_API_KEY) //new code

var fs = require("fs");
var mailPage = fs.readFileSync(__dirname + "/webpage/mail.html", "utf8");

var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);

function sendRegistrationEmail(email, encodedEmail) {
	var emailContent = 'Thank you for registering for www.meetspace.co.nz.\n\n';
	emailContent += 'Click the link below to activate your account\n\n';
	emailContent += 'http://www.meetspace.co.nz/useractivate/' + encodedEmail + '\n\n';

	var to_email = new helper.Email(email);
	var subject = 'Meetspace Registration';
	var content = new helper.Content('text/plain', emailContent);
	var mail = new helper.Mail(from_email, subject, to_email, content);

	var request = sg.emptyRequest({
	  method: 'POST',
	  path: '/v3/mail/send',
	  body: mail.toJSON(),
	});

	sg.API(request, function(error, response) {
		console.log(response.statusCode);
		console.log(response.body);
		console.log(response.headers);
	});
}
module.exports.sendRegistrationEmail = sendRegistrationEmail;

function sendPostEmail(email, fromUser, activity, url, subject, emailContent) {
	var htmlFormatted = mailPage;
	htmlFormatted = htmlFormatted.replace('!%ACTIVITY%!', activity);
	htmlFormatted = htmlFormatted.replace('!%FROMUSER%!', fromUser);
	htmlFormatted = htmlFormatted.replace('!%EMAIL_CONTENT%!', emailContent);
	htmlFormatted = htmlFormatted.replace('!%URL%!', url);

	var msg = {
		to: email,
		from: 'meetspace.noreply@gmail.com', // Change to your verified sender
		subject: activity,
		text: fromUser + ' posted:\n\n' + emailContent + '\n\n' + url,
		html: htmlFormatted
	  };
	  
	  sgMail
		.send(msg)
		.then((response) => {
		  console.log('statuscode: ' + response[0].statusCode);
		  console.log('header: ' + response[0].headers);
		})
		.catch((error) => {
		  console.error('error!!: ' + error);
		});
}
module.exports.sendPostEmail = sendPostEmail;

function sendInviteEmail(email, fromUser, activityUrl, activityTitle) {
	var htmlFormatted = mailPage;

	var emailContent = 'Hello ' + email + ', <br/>';
	emailContent += 'You have been invited to the activity \'' + activityTitle + '\' from \'' + fromUser + '\'.<br/>';
	emailContent += 'If you would like to join the activity, click the meetspace link below.<br/>';
	emailContent += '<br/>';
	emailContent += 'Thanks, the Meetspace Team!';

	htmlFormatted = htmlFormatted.replace('!%ACTIVITY%!', activityTitle);
	htmlFormatted = htmlFormatted.replace('!%FROMUSER%!', 'the Meetspace Team');
	htmlFormatted = htmlFormatted.replace('!%EMAIL_CONTENT%!', emailContent);
	htmlFormatted = htmlFormatted.replace('!%URL%!', activityUrl);

	console.log('html');
	console.log(htmlFormatted);

	var msg = {
		to: email,
		from: 'meetspace.noreply@gmail.com', // Change to your verified sender
		subject: 'Invitation to ' + activityTitle,
		text: fromUser + ' invited you to ' + activityTitle + ' click the following link to see ' + activityUrl,
		html: htmlFormatted
	  };
	  
	  console.log('msg');
	  console.log(msg);

	  sgMail
		.send(msg)
		.then((response) => {
		  console.log(response[0].statusCode);
		  console.log(response[0].headers);
		})
		.catch((error) => {
		  console.error(error);
		});
}
module.exports.sendInviteEmail = sendInviteEmail;

function forgotEmail(email, username, password) {
	var emailContent = 'You are have requested that your password be sent to this email.\n\n';
	emailContent += 'The password for ' + username + ' is: ' + password + '';

	var to_email = new helper.Email(email);
	var subject = 'Meetspace Password';
	var content = new helper.Content('text/plain', emailContent);
	var mail = new helper.Mail(from_email, subject, to_email, content);

	var request = sg.emptyRequest({
	  method: 'POST',
	  path: '/v3/mail/send',
	  body: mail.toJSON(),
	});

	sg.API(request, function(error, response) {
		console.log(response.statusCode);
		console.log(response.body);
		console.log(response.headers);
	});
}
module.exports.forgotEmail = forgotEmail;