var helper = require('sendgrid').mail;
var from_email = new helper.Email('meetspace.noreply@gmail.com');

var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);

function sendRegistrationEmail(email, encodedEmail) {
	var emailContent = 'Thank you for registering for meetspace.co.nz.<br><br>\n\n';
	var emailContent = 'Click the link below to activate your account<br><br>\n\n';
	emailContent += '<a href="meetspace.co.nz/activate/' + encodedEmail + '">Activate your account</a><br><br>';

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