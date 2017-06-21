module.exports = {
	doRespondingTest: 1,
	numberOfMsgsToRespond: 30,

	doSendingWithoutResposeTest: 0,
	numberOfMsgsToSendWithoutResponse: 30,

	offset: 0, // wait for this many messages before going to next tests

	numOfOnlineUsers: 3, // in conversation including testing browser (protractor)
	numberOfMsgsForLevel: 5,
	clearAllClients: 1 // before all tests
}