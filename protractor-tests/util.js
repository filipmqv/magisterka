// var MAIN_URL = 'http://192.168.1.5:9000/';
var MAIN_URL = 'https://webtorrent-chat-client.herokuapp.com/';

function sleep(bwser, ms) {
	bwser.sleep(ms)
}

function login(bwser, email, password) {
	email = email || 'moz@wp.pl';
	password = password || 'password';
	bwser.get(MAIN_URL + '#!/login');
	var loginEl = bwser.element(by.id('inputEmail'));
	var passwordEl = bwser.element(by.id('inputPassword'));
	var loginButton = bwser.element(by.buttonText('Sign in'));
	loginEl.sendKeys(email);
	passwordEl.sendKeys(password);
	loginButton.click();
}

function sendMessage(bwser, text) {
	text = text || 'sample message';
	var messageInput = bwser.element(by.model('textInput'));
	var sendButton = bwser.element(by.buttonText('Send!'));
	messageInput.sendKeys(text);
	sendButton.click();
}

const numberOfOnlineUsersInConversation = 4;

module.exports = {
	sleep: sleep,
	login: login,
	sendMessage: sendMessage,
	numOfOnlineUsers: numberOfOnlineUsersInConversation
}