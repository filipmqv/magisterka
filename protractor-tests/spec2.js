var util = require('./util.js');

describe('Protractor WCC Tests With Other Browsers', function() {
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

  beforeAll(function() {
    util.login(browser, 'test1@wp.pl');
  });

  var originalTimeout;
  beforeEach(function() {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
  });

  it('should land on messenger page', function() {
    expect(conversation.count()).toEqual(0);
  });

  it('should send a message', function() {
    for(var i=0; i < 34; i++){
      util.sendMessage(browser, 'sample message ' + (i+1));
    }
    var lastMsg = element(by.repeater('item in getConversation()').row(34-1));
    browser.wait(until.presenceOf(lastMsg), 5000, 'Element taking too long to appear in the DOM');
    expect(conversation.count()).toEqual(34);
    console.log('count done')
    browser.controlFlow().execute(function() {
      // util.sleep(browser, 60000);
    });
  });

  it('should get message from other browsers', function() {
    waitForXMessagesForYSeconds(36, 60)
  });

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
});