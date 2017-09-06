module.exports = {
	email: 'test1@wp.pl',
	numOfOnlineUsers: 					4, // in conversation including testing browser (protractor)
	numberOfMsgsForLevel: 				5,
	setOptionsAndClearAllClients: 		0, // before all tests

	browsersOn: 						4, // for information only

	offset: 							0, // do waiting test - wait for this many messages

	doRespondingTest: 					0,
	numberOfMsgsToRespond: 				1,

	doSendingWithoutResposeTest: 		1,
	numberOfMsgsToSendWithoutResponse: 	1,
	sleepAfterSending: 					2,


	waitingTime: 						120,
	noop: 0
}