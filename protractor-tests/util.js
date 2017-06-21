// const MAIN_URL = 'http://192.168.1.5:9000/';
const MAIN_URL = 'https://webtorrent-chat-client.herokuapp.com/';



function sleep(bwser, seconds) {
	bwser.sleep(seconds * 1000)
}

var start;
function startCounting(browser) {
	browser.controlFlow().execute(function() {
		console.log('start counting')
	 	start = new Date().getTime();
	});
}

function finishCounting(browser, text) {
	browser.controlFlow().execute(function() {
		var endTime = new Date().getTime();
		var total = endTime - start;
		console.log(text + ' >>> ' + total + 'ms');
	});
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

function clearAllBrowsers(bwser) {
	var clearBtn = bwser.element(by.id('reqClearButton'));
	clearBtn.click();
}

function emitSet(bwser, number) {
	var setBtn = bwser.element(by.id('reqSetButton'));
	var txt = bwser.element(by.id('reqSetInput'));
	txt.sendKeys(number);
	setBtn.click();
}

function setReplyers(bwser, numberOfReplyers) {
	var setBtn = bwser.element(by.id('reqReplyerButton'));
	var txt = bwser.element(by.id('reqReplyerInput'));
	txt.sendKeys(numberOfReplyers);
	setBtn.click();
}

function setAllOptions(bwser, numberOfReplyers, numberOfMessagesForLevel) {
	var setBtn = bwser.element(by.id('reqOptionsBtn'));
	var replInput = bwser.element(by.id('reqReplyerInput'));
	var numInput = bwser.element(by.id('reqSetInput'));
	replInput.sendKeys(numberOfReplyers.toString());
	numInput.sendKeys(numberOfMessagesForLevel.toString());
	setBtn.click();
}

module.exports = {
	sleep: sleep,
	startCounting: startCounting,
	finishCounting: finishCounting,
	login: login,
	sendMessage: sendMessage,
	clearAllBrowsers: clearAllBrowsers,
	emitSet: emitSet,
	setReplyers: setReplyers,
	setAllOptions: setAllOptions
}