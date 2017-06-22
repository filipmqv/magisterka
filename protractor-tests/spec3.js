var util = require('./util.js');
var params = require('./test-params.js');

describe('Protractor WCC Tests With Other Browsers with Auto Replying', function() {
  var conversation = element.all(by.repeater('item in getConversation()'));
  var until = protractor.ExpectedConditions; // for waiting condition

  function waitForMessageWithId(idToWait, seconds) {
    var elToWait = $('#message' + idToWait)
    browser.wait(until.presenceOf(elToWait), seconds * 1000);
  }

  function doSendingTest(i) {
    it('should send a reques', function() {
      util.sendMessage(browser, 'AUTO_REPLY_REQUEST ' + i);
      util.startCounting(browser);
    });
  }

  function doWaitingTest(i, idToWait) {
    it('should wait for response with ID', function() {
      waitForMessageWithId(idToWait, 120);
      util.finishCounting(browser, '    ' + 'AUTO_REPLY_REQUEST ' + i);
    })
  }

  function getRange(i) {
    var minMsgId = params.offset + (i-1) * params.numOfOnlineUsers + params.numOfOnlineUsers + 1;
    var maxMsgId = params.offset + i * params.numOfOnlineUsers + params.numOfOnlineUsers - 1;
    return util.range(minMsgId, maxMsgId)
  }

  beforeAll(function() {
    util.login(browser, params.email);
    if (params.setOptionsAndClearAllClients) {
      util.setAllOptions(browser, params.numOfOnlineUsers-1, params.numberOfMsgsForLevel);
    }
    console.log('email: ' + params.email)
    console.log('replyers: ' + (params.numOfOnlineUsers-1))
    console.log('browsers_on: ' + params.browsersOn)
    console.log('msgs_for_lvl: ' + params.numberOfMsgsForLevel)
    console.log('set_done?: '+ params.setOptionsAndClearAllClients)
  });

  var originalTimeout;
  beforeEach(function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1200000;
  });





  it('should land on messenger page with empty conversation', function() {
    expect(conversation.count()).toEqual(0);
  });

  if (params.offset) {
    it('should get X (offset) messages first', function() {
      util.startCounting(browser);
      waitForMessageWithId(params.offset - 1, 120);
      util.finishCounting(browser, 'waiting for ' + params.offset + ' msgs');
    });
  }

  if (params.doRespondingTest) { 
    var range = util.range(0, params.numberOfMsgsToRespond-1);
    range.map(function(i) {
      doSendingTest(i);

      var rangeOfIdsToWait = getRange(i);
      rangeOfIdsToWait.map(function(idToWait){
        doWaitingTest(i, idToWait);
      })
    });
  }

  if (params.doSendingWithoutResposeTest) {
    it('should send X messages without waiting', function() {
      for(var i = 0; i < params.numberOfMsgsToSendWithoutResponse; i++) {
        var msgId = params.offset + i * params.numOfOnlineUsers + params.numOfOnlineUsers - 1;
        util.sendMessage(browser, 'normal msg ' + i);
      }
      util.sleep(browser, 120)
    })
  }




  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
});