var util = require('./util.js');

describe('Protractor WCC Tests With Other Browsers with Auto Replying', function() {
  var conversation = element.all(by.repeater('item in getConversation()'));
  var until = protractor.ExpectedConditions; // for waiting condition

  function waitForXMessagesForYSeconds(x, y) {
    var pageLoaded;
    browser.controlFlow().execute(function() {
      pageLoaded = new Date().getTime();
    });

    var firstTorrentAdded = element(by.repeater('item in getConversation()').row(0));
    browser.wait(until.presenceOf(firstTorrentAdded), 20000, 'Element taking too long to appear in the DOM');

    var torrentsAdded;
    browser.controlFlow().execute(function() {
      torrentsAdded = new Date().getTime();
    });

    var secondMsg = element(by.repeater('item in getConversation()').row(x-1));
    browser.wait(until.presenceOf(secondMsg), y*1000, 'Element taking too long to appear in the DOM');
    expect(conversation.count()).toEqual(x);

    browser.controlFlow().execute(function() {
      var endTime = new Date().getTime();
      var pageLoadedTime = endTime - pageLoaded;
      var torrentsAddedTime = endTime - torrentsAdded;
      console.log('pageLoadedTime = ' + pageLoadedTime + 'ms');
      console.log('torrentsAddedTime = ' + torrentsAddedTime + 'ms');
    });
  }

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
    waitForMessageWithId(idToWait, 60);

    browser.controlFlow().execute(function() {
      var endTime = new Date().getTime();
      var total = endTime - start;
      console.log(text + ' total = ' + total + 'ms');
    });
  }

  beforeAll(function() {
    util.login(browser, 'test1@wp.pl');
  });

  var originalTimeout;
  beforeEach(function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1200000;
  });





  it('should land on messenger page', function() {
    expect(conversation.count()).toEqual(0);
  });

  it('should measure conversation timing', function() {
    for(var i = 0; i < 30; i++) {
      sendAndWait('AUTO_REPLY_REQUEST ' + i, i*2+1);
    }
  })




  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
});