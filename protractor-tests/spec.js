var util = require('./util.js');

describe('Protractor Webtorrent Chat Client Simple Tests', function() {
  var conversation = element.all(by.repeater('item in getConversation()'));

  beforeAll(function() {
    util.login(browser, 'test1@wp.pl');
  });

  it('should land on messenger page', function() {
    expect(conversation.count()).toEqual(0);
  });

  it('should send a message', function() {
    util.sendMessage(browser);
    expect(conversation.count()).toEqual(1);
  });

  it('should get message from browser2', function() {
    var browser2 = browser.forkNewDriverInstance();
    util.login(browser2, 'test2@wp.pl');
    util.sendMessage(browser2);
    var until = protractor.ExpectedConditions;
    var secondMsg = element(by.repeater('item in getConversation()').row(1));
    // original browser waits
    browser.wait(until.presenceOf(secondMsg), 15000, 'Element taking too long to appear in the DOM');
    expect(conversation.count()).toEqual(2);
    var messageText = element(by.id('message1'));
    expect(messageText.getText()).toContain('2   sample message');
  });
});