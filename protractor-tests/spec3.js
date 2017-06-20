var util = require('./util.js');

describe('Protractor WCC Tests With Other Browsers with Auto Replying', function() {
  var conversation = element.all(by.repeater('item in getConversation()'));
  var until = protractor.ExpectedConditions; // for waiting condition
  var offset = 0;

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

  function sendAndWait(text, idToWait) {
    var start;
    browser.controlFlow().execute(function() {
      start = new Date().getTime();
    });

    util.sendMessage(browser, text);
    waitForMessageWithId(idToWait, 120);

    browser.controlFlow().execute(function() {
      var endTime = new Date().getTime();
      var total = endTime - start;
      console.log(text + ' total = ' + total + 'ms');
    });
  }

  beforeAll(function() {
    util.login(browser, 'test1@wp.pl');
    util.emitSet(browser, '5');
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
    if (offset) waitForMessageWithId(offset - 1, 120);
  });

  it('should wait for all responses before next request', function() {
    for(var i = 0; i < 30; i++) {
      var msgId = offset + i * util.numOfOnlineUsers + util.numOfOnlineUsers - 1;
      sendAndWait('AUTO_REPLY_REQUEST ' + i, msgId);
    }
  })




  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
});