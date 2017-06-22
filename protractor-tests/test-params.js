module.exports = {
	email: 'test1@wp.pl',
	numOfOnlineUsers: 3, // in conversation including testing browser (protractor)
	numberOfMsgsForLevel: 5,
	setOptionsAndClearAllClients: 0, // before all tests

	browsersOn: 3, // for information only

	offset: 30, // do waiting test - wait for this many messages

	doRespondingTest: 0,
	numberOfMsgsToRespond: 2,

	doSendingWithoutResposeTest: 0,
	numberOfMsgsToSendWithoutResponse: 30,


	noop: 0
}