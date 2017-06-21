var util = require('./util.js');
var params = require('./test-params.js');

describe('Protractor WCC Tests With Other Browsers with Auto Replying', function() {
  var conversation = element.all(by.repeater('item in getConversation()'));
  var until = protractor.ExpectedConditions; // for waiting condition


  function waitForMessage(textToWait, seconds) {
    var elWithTextToWait = $$('.discussion .message-content').filter(function(elem, index) {
      return elem.getText().then(function(text) {
        return text === textToWait;
      });
    }).first()
    browser.wait(until.presenceOf(elWithTextToWait), seconds * 1000);
  }

  function waitForMessageWithId(idToWait, seconds) {
    var elToWait = $('#message' + idToWait)
    browser.wait(until.presenceOf(elToWait), seconds * 1000);
  }

  function sendAndWait(text, minMsgId, maxMsgId) {
    util.startCounting(browser);

    util.sendMessage(browser, text);
    browser.controlFlow().execute(function() {
      for (var idToWait = minMsgId; idToWait <= maxMsgId; idToWait++) {
        console.log('waiting for ' + idToWait)
        waitForMessageWithId(idToWait, 120);
        util.finishCounting(browser, '         ' + text);
      }
      
    })
    

    util.finishCounting(browser, text);
  }

  beforeAll(function() {
    util.login(browser, 'test1@wp.pl');
    if (params.clearAllClients) {
      util.setAllOptions(browser, params.numOfOnlineUsers-1, params.numberOfMsgsForLevel);
    }
  });

  var originalTimeout;
  beforeEach(function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1200000;
  });





  it('should land on messenger page with empty conversation', function() {
    expect(conversation.count()).toEqual(0);
  });

  it('should get X (offset) messages first', function() {
    if (params.offset) {
      util.startCounting(browser);
      waitForMessageWithId(params.offset - 1, 120);
      util.finishCounting(browser, 'waiting for ' + params.offset + ' msgs');
    }
  });

  if (params.doRespondingTest) { 
    it('should wait for all responses before next request', function() {
      for(var i = 0; i < params.numberOfMsgsToRespond; i++) {
        var minMsgId = params.offset + (i-1) * params.numOfOnlineUsers + params.numOfOnlineUsers;
        var maxMsgId = params.offset + i * params.numOfOnlineUsers + params.numOfOnlineUsers - 1;
        sendAndWait('AUTO_REPLY_REQUEST ' + i, minMsgId, maxMsgId);
      }
    })
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