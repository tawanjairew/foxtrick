'use strict';
/**
 * env.js
 * Foxtrick environment
 * @author convinced, LA-MJ
 */

/* globals Components, Services, BrowserApp */
/* globals addMessageListener, removeMessageListener, messageManager, sendAsyncMessage */
/* globals safari, chrome */

if (!Foxtrick)
	var Foxtrick = {};

/**
 * Browser architecture: Sandboxed|Gecko.
 *
 * Sandboxed: Chrome/Opera and Safari.
 * Gecko: Firefox/Android.
 * Used to help abstract Foxtrick APIs in the back-end and utils.
 *
 * README: Many of the Sandboxed features also applies to Android and
 * will apply to Firefox after e10s support is finished hence this
 * distinction needs to be redesigned.
 *
 * @type {string}
 */
Foxtrick.arch = 'arch';

/**
 * Browser name: Chrome|Safari|Firefox|Android.
 *
 * Used to help abstract Foxtrick APIs in the back-end and utils.
 *
 * README: Opera is currently detected as Chrome and uses the same API.
 *
 * @type {string}
 */
Foxtrick.platform = 'Browser';

/**
 * Execution context: background|content.
 *
 * Signifies separation of permissions
 *
 * @type {string}
 */
Foxtrick.context = 'context';

/**
 * Path to content/ files from an internal context.
 *
 * Typically used to load CSS and other non-script files.
 *
 * README: used for images but this likely needs to be switched to ResourcePath.
 *
 * @type {string}
 */
Foxtrick.InternalPath = 'content/';

/**
 * Path to content/ files from an external context.
 *
 * Typically used for image URLs in CSS.
 * May be different from InternalPath.
 *
 * @type {string}
 */
Foxtrick.ResourcePath = 'content/';

/**
 * Path to independently updated resource files like links.json.
 *
 * Is currently local for Android to limit network requests.
 *
 * @type {string}
 */
Foxtrick.DataPath = 'res/';

/**
 * Data URL image cache.
 *
 * For image path conversion to data URLs.
 * {URL: dataURL}
 *
 * README: currently unused.
 *
 * @type {Object} {string: string}
 */
Foxtrick.dataUrlStorage = {};

/**
 * Sandboxed adapter, based on AdBlockPlus for Safari
 * @type {Object}
 */
Foxtrick.SB = { ext: { onRequest: {}}, tabs: {}};

// --------------------- function stubs ----------------
// jshint ignore:start

/**
 * Get a reference to background page from another elevated context
 *
 * README: does not make sense in Gecko for now
 *
 * @return {[type]} [description]
 */
Foxtrick.SB.ext.getBackgroundPage = function() {};

/**
 * Get the URL of a path relative to the extension folder
 *
 * @param  {string} path
 * @return {string}
 */
Foxtrick.SB.ext.getURL = function(path) {};

/**
 * Send data (plain JSON-like object) from content to background.
 *
 * callback: function(response).
 *
 * @param  {object}   data
 * @param  {function} callback {function(object)}
 */
Foxtrick.SB.ext.sendRequest = function(data, callback) {};

/**
 * Send data (plain JSON-like object) from background to all tabs.
 *
 * callback: function(response).
 *
 * @param  {object}   data
 * @param  {function} callback {function(object)}
 */
Foxtrick.SB.ext.broadcastMessage = function(data, callback) {};

/**
 * Listen to requests (background and content side).
 *
 * listener: function(data, sender, sendResponse);
 * data: request object;
 * sender: { tab: { id, url }}, undefined from background;
 * sendResponse: function(response).
 *
 * sendResponse(response) should be called at the end of the listener.
 *
 * @param {function} listener {function(function(object, object, function(object)))}
 */
Foxtrick.SB.ext.onRequest.addListener = function(listener) {};

/**
 * Remove a listener added with onRequest.addListener
 *
 * @param {function} listener {function(function(object, object, function(object)))}
 */
Foxtrick.SB.ext.onRequest.removeListener = function(handler) {};

/**
 * tabId of a content script.
 *
 * Somewhat unreliable.
 *
 * @type {Number}
 */
Foxtrick.SB.ext.tabId = -1;

/**
 * Get the tab ID for a tab
 *
 * @param  {object} tab
 * @return {number}
 */
Foxtrick.SB.tabs.getId = function(tab) {};

/**
 * Open an URL in a new tab
 *
 * @param  {string} url
 */
Foxtrick.SB.tabs.create = function(url) {};

// jshint ignore:end

/**
 * Define a lazy-loaded cached property
 *
 * @param {object}   obj
 * @param {string}   prop
 * @param {function} calc
 */
Foxtrick.lazyProp = function(obj, prop, calc) {
	Object.defineProperty(obj, prop, {
		configurable: true,
		enumerable: true,
		get: function() {
			var val = calc();
			delete this[prop];
			this[prop] = val;
			return val;
		},
	});
};

(function() {

	// messaging abstraction
	var addListener, removeListener, sendRequest;
	var REQUEST = 'request@foxtrick.org';
	var RESPONSE = 'response@foxtrick.org';

	// stores onRequest handlers so we can unregister them again
	var ONREQUEST_HANDLERS = new Map();

	if (typeof safari === 'object') {
		Foxtrick.arch = 'Sandboxed';
		Foxtrick.platform = 'Safari';
		Foxtrick.InternalPath = Foxtrick.ResourcePath = safari.extension.baseURI + 'content/';
		Foxtrick.DataPath = safari.extension.baseURI + 'res/';

		// to tell which context the chrome script is running at
		// either background page, or content script
		Foxtrick.lazyProp(Foxtrick, 'context', function() {
			var ret;
			try {
				if (safari.application) {
					ret = 'background';
				}
				else {
					ret = 'content';
				}
			}
			catch (e) {
				ret = 'content';
			}
			return ret;
		});

		addListener = function(handler) {
			var target = safari.self;
			if (!target.addEventListener)
				target = safari.application;

			target.addEventListener('message', handler);
		};
		removeListener = function(handler) {
			var target = safari.self;
			if (!target.removeListener)
				target = safari.application;

			target.removeEventListener('message', handler);
		};

		sendRequest = (function() {
			// The function we'll return at the end of all this
			var theFunction = function(target, data, callback) {
				var callbackToken = 'callback' + Math.random();
				var msg = { data: data, callbackToken: callbackToken };

				// Listen for a response for our specific request token.
				addOneTimeResponseListener(callbackToken, callback);

				target.dispatchMessage(REQUEST, msg);
			};

			// Make a listener which, when activated for the given callbackToken,
			// calls callback(resultData) and unregisters itself
			var addOneTimeResponseListener = function(callbackToken, callback) {

				var responseHandler = function(ev) {
					var run = function(callback) {
						try {
							callback(ev.message.data);
						}
						catch (e) {
							Foxtrick.log('callback error:', e);
						}
					};

					if (ev.name != RESPONSE)
						return;
					if (ev.message.callbackToken != callbackToken)
						return;

					removeListener(responseHandler);

					if (typeof callback === 'function') {
						run(callback);
					}
				};

				addListener(responseHandler);
			};

			return theFunction;
		})();

		Foxtrick.SB.ext.getBackgroundPage = function() {
			return safari.extension.globalPage.contentWindow;
		};

		Foxtrick.SB.ext.getURL = function(path) {
			return safari.extension.baseURI + path;
		};

		Foxtrick.SB.ext.sendRequest = function(data, callback) {
			var target = safari.self.tab ||
				safari.application.activeBrowserWindow.activeTab.page;

			sendRequest(target, data, callback);
		};
		// sending to all tabs
		Foxtrick.SB.ext.broadcastMessage = function(data, callback) {
			Foxtrick.forEach(function(tab) {
				sendRequest(tab.page, data, callback);
			}, safari.application.activeBrowserWindow.tabs);
		};

		Foxtrick.SB.ext.onRequest.addListener = function(handler) {
			var makeHandler = function(handler) {
				return function(ev) {
					// Only listen for 'sendRequest' messages
					if (ev.name != REQUEST)
						return;

					var request = ev.message.data;
					var id = Foxtrick.SB.tabs.getId(ev.target);
					var sender = { tab: { id: id, url: ev.target.url }};

					var sendResponse = function(dataToSend) {
						var reply = {
							callbackToken: ev.message.callbackToken,
							data: dataToSend,
						};

						ev.target.page.dispatchMessage(RESPONSE, reply);
					};
					handler(request, sender, sendResponse);
				};
			};

			var responseHandler = makeHandler(handler);
			ONREQUEST_HANDLERS.set(handler, responseHandler);
			addListener(responseHandler);
		};
		Foxtrick.SB.ext.onRequest.removeListener = function(handler) {
			var responseHandler = ONREQUEST_HANDLERS.get(handler);
			if (typeof responseHandler !== 'undefined') {
				ONREQUEST_HANDLERS.delete(handler);
				removeListener(responseHandler);
			}
		};

		// Track tabs that make requests to the global page, assigning them
		// IDs so we can recognize them later.
		Foxtrick.SB.tabs.getId = (function() {
			// Tab objects are destroyed when no one has a reference to them,
			// so we keep a list of them, lest our IDs get lost.
			var tabs = [];
			var lastAssignedTabId = -1;

			var theFunction = function(tab) {
				// Clean up closed tabs, to avoid memory bloat.
				tabs = tabs.filter(function(t) { return t.browserWindow !== null; });

				if (typeof tab._ftId === 'undefined') {
					// New tab
					tab._ftId = ++lastAssignedTabId;
					tabs.push(tab); // save so it isn't garbage collected, losing our ID.
				}
				return tab._ftId;
			};
			return theFunction;
		})();

		Foxtrick.SB.tabs.create = function(options) {
			var window = safari.application.activeBrowserWindow;
			window.openTab('foreground').url = options.url;
		};
	}

	else if (typeof chrome === 'object') {
		Foxtrick.arch = 'Sandboxed';
		Foxtrick.platform = 'Chrome';
		Foxtrick.InternalPath = Foxtrick.ResourcePath = chrome.runtime.getURL('content/');
		Foxtrick.DataPath = chrome.runtime.getURL('res/');

		// to tell which context the chrome script is running at
		// either background page, or content script
		Foxtrick.lazyProp(Foxtrick, 'context', function() {
			var ret;
			try {
				if (window.location.protocol == 'chrome-extension:') {
					ret = 'background';
				}
				else {
					ret = 'content';
				}
			}
			catch (e) {
				ret = 'content';
			}
			return ret;
		});

		Foxtrick.SB.ext.getBackgroundPage = function() {
			return chrome.extension.getBackgroundPage();
		};
		Foxtrick.SB.ext.getURL = function(path) {
			return chrome.runtime.getURL(path);
		};

		Foxtrick.SB.ext.sendRequest = function(data, callback) {
			try {
				if (callback)
					chrome.runtime.sendMessage(data, callback);
				else
					chrome.runtime.sendMessage(data);
			}
			catch (e) {}
		};
		// README: chrome implementation uses direct binding to sendResponse function rather
		// than callback tokens, thus normally there are no listeners on the content side.
		Foxtrick.SB.ext.broadcastMessage = function(data, callback) {
			try {
				for (var i in ACTIVE_TABS) {
					if (callback)
						chrome.tabs.sendMessage(Number(i), data, callback);
					else
						chrome.tabs.sendMessage(Number(i), data);
				}
			}
			catch (e) {}
		};

		Foxtrick.SB.ext.onRequest.addListener = function(handler) {
			var makeHandler = function(handler) {
				return function(data, sender, sendResponse) {
					handler(data, sender, sendResponse);
					return true; // assure message channel is left open for async
				};
			};
			var responseHandler = makeHandler(handler);
			ONREQUEST_HANDLERS.set(handler, responseHandler);
			chrome.runtime.onMessage.addListener(responseHandler);
		};
		Foxtrick.SB.ext.onRequest.removeListener = function(handler) {
			var responseHandler = ONREQUEST_HANDLERS.get(handler);
			if (typeof responseHandler !== 'undefined') {
				ONREQUEST_HANDLERS.delete(handler);
				chrome.runtime.onMessage.removeListener(responseHandler);
			}
		};

		var ACTIVE_TABS = {};

		Foxtrick.SB.tabs.getId = function(tab) {
			return tab.id;
		};

		Foxtrick.SB.tabs.create = function(url) {
			chrome.tabs.create(url);
		};

		if (Foxtrick.context === 'content') {
			// register this tab for broadcastMessage messages and receive tabId
			Foxtrick.SB.ext.sendRequest({ req: 'register' },
			  function(response) {
				Foxtrick.SB.ext.tabId = response.tabId;
			});

			// README: chrome content listeners go here

			// answer to status check after every new page load
			Foxtrick.SB.ext.onRequest.addListener(
			  function(request, sender, sendResponse) {
				if (request.req == 'checkAlive') {
					// send back who answered
					sendResponse({ id: request.id });
				}
			});
		}
		else if (Foxtrick.context === 'background') {
			(function() {
				var confirmAlive = function(response) {
					if (response)
						ACTIVE_TABS[response.id] = true;
				};

				// request tabs to confirm being alive
				var updateTabList = function(senderId) {
					var tabListOld = ACTIVE_TABS;
					// clear list and add alive tabs again
					ACTIVE_TABS = {};
					for (var i in tabListOld) {
						// not the sender
						if (i != senderId) {
							var msg = { req: 'checkAlive', id: i };
							chrome.tabs.sendMessage(Number(i), msg, confirmAlive);
						}
					}
					ACTIVE_TABS[senderId] = true;
				};

				// listen to tab register
				Foxtrick.SB.ext.onRequest.addListener(
				  function(request, sender, sendResponse) {
					if (request.req == 'register') {
						updateTabList(sender.tab.id);
						sendResponse({ tabId: sender.tab.id });
					}
				});
			})();
		}
	}

	else {
		Foxtrick.arch = 'Gecko';
		Foxtrick.InternalPath = Foxtrick.ResourcePath = 'chrome://foxtrick/content/';
		Foxtrick.DataPath = 'chrome://foxtrick_resources/content/';

		Components.utils.import('resource://gre/modules/Services.jsm');
		var appInfoID = Services.appinfo.ID;
		if (appInfoID == '{aa3c5121-dab2-40e2-81ca-7ea25febc110}')
			Foxtrick.platform = 'Android';
		else
			Foxtrick.platform = 'Firefox'; // includes SeaMonkey here

		if (Foxtrick.platform === 'Android') {
			Foxtrick.lazyProp(Foxtrick, 'context', function() {
				if (typeof sendSyncMessage === 'function')
					return 'content';
				else
					return 'background';
			});
		}
		else {
			Foxtrick.context = 'background';
		}

		if (Foxtrick.platform === 'Android') {
			if (typeof addMessageListener !== 'undefined' ||
			    typeof messageManager !== 'undefined') {

				addListener = function(name, handler) {
					if (typeof addMessageListener === 'function')
						addMessageListener(name, handler);
					else
						messageManager.addMessageListener(name, handler);
				};
				removeListener = function(name, handler) {
					if (typeof removeMessageListener === 'function')
						removeMessageListener(name, handler);
					else
						messageManager.removeMessageListener(name, handler);
				};
			}
			else {
				// happens for fennec prefs. not needed thus ignored or it would mess up above

				/* jshint ignore:start */
				addListener = function(name, handler) {};
				removeListener = function(name, handler) {};
				/* jshint ignore:end */
			}

			sendRequest = (function() {
				// The function we'll return at the end of all this
				var theFunction = function(target, data, callback) {
					var callbackToken = 'callback' + Math.random();
					var msg = { data: data, callbackToken: callbackToken };

					// Listen for a response for our specific request token.
					addOneTimeResponseListener(callbackToken, callback);

					if (target && typeof target.sendAsyncMessage === 'function') {
						target.sendAsyncMessage(REQUEST, msg);
					}
					else if (typeof sendAsyncMessage === 'function') {
						sendAsyncMessage(REQUEST, msg);
					}
					else {
						messageManager.broadcastAsyncMessage(REQUEST, msg);
					}
				};

				// Make a listener which, when activated for the given callbackToken,
				// calls callback(resultData) and unregisters itself
				var addOneTimeResponseListener = function(callbackToken, callback) {

					var responseHandler = function(ev) {
						var run = function(callback) {
							try {
								callback(ev.json.data);
							}
							catch (e) {
								Foxtrick.log('callback error:', e);
							}
						};

						// content context
						if (ev.json.callbackToken != callbackToken)
							return;

						removeListener(RESPONSE, responseHandler);

						if (typeof callback === 'function') {
							run(callback);
						}
					};

					addListener(RESPONSE, responseHandler);
				};

				return theFunction;
			})();

			Foxtrick.SB.ext.getURL = function(path) {
				return 'chrome://foxtrick/' + path;
			};

			Foxtrick.SB.ext.sendRequest = function(data, callback) {
				sendRequest(null, data, callback);
			};

			Foxtrick.SB.ext.broadcastMessage = function(data, callback) {
				var getMessageSenders = function(msgMngr) {
					if (!msgMngr)
						return [];

					if (typeof msgMngr.sendAsyncMessage === 'function') {
						return [msgMngr];
					}

					var senders = [];
					var ct = msgMngr.childCount;
					for (var i = 0; i < ct; i++) {
						var childMM = msgMngr.getChildAt(i);
						var childs = getMessageSenders(childMM);
						senders.push.apply(senders, childs);
					}
					return senders;
				};

				var msgSenders = Foxtrick.unique(getMessageSenders(messageManager));
				for (var msgSender of msgSenders) {
					sendRequest(msgSender, data, callback);
				}
			};

			Foxtrick.SB.ext.onRequest.addListener = function(handler) {
				// make a wrapper for the handler to pass a sendResponse reference
				var makeHandler = function(handler) {
					return function(ev) {
						// bg context
						var request = ev.json.data;
						var id = Foxtrick.SB.tabs.getId(ev.target);

						var sender = {
							tab: {
								id: id,
								url: ev.target.lastLocation,
								target: ev.target,
							},
						};

						var sendResponse = function(dataToSend) {
							var reply = {
								callbackToken: ev.json.callbackToken,
								data: dataToSend,
							};

							if (typeof sendAsyncMessage === 'function') {
								sendAsyncMessage(RESPONSE, reply);
							}
							else if (typeof messageManager !== 'undefined') {
								try {
									var childMM = ev.target.messageManager;
									childMM.sendAsyncMessage(RESPONSE, reply);
								}
								catch (e) {
									Foxtrick.error('No MessageSender');
									messageManager.broadcastAsyncMessage(RESPONSE, reply);
								}
							}
						};

						handler(request, sender, sendResponse);
					};
				};

				var responseHandler = makeHandler(handler);
				ONREQUEST_HANDLERS.set(handler, responseHandler);
				addListener(REQUEST, responseHandler);
			};
			Foxtrick.SB.ext.onRequest.removeListener = function(handler) {
				var responseHandler = ONREQUEST_HANDLERS.get(handler);
				if (typeof responseHandler !== 'undefined') {
					ONREQUEST_HANDLERS.delete(handler);
					removeListener(REQUEST, responseHandler);
				}
			};

			// Track tabs that make requests to the global page, assigning them
			// IDs so we can recognize them later.
			Foxtrick.SB.tabs.getId = (function() {
				// Tab objects are destroyed when no one has a reference to them,
				// so we keep a list of them, lest our IDs get lost.
				var tabs = [];
				var lastAssignedTabId = -1;

				var theFunction = function(tab) {
					// Clean up closed tabs, to avoid memory bloat.
					tabs = tabs.filter(function(t) { return t.browser !== null; });

					if (typeof tab._ftId === 'undefined') {
						// New tab
						tab._ftId = ++lastAssignedTabId;
						// save it so it isn't garbage collected, losing our ID
						tabs.push(tab);
					}
					return tab._ftId;
				};

				return theFunction;
			})();

			Foxtrick.SB.tabs.create = function(data) {
				if (Foxtrick.platform === 'Android')
					BrowserApp.addTab(data.url);
				else
					window.gBrowser.selectedTab = window.gBrowser.addTab(data.url);
			};
		}
	}


	// Node not available for all browsers. let's just use our own
	Foxtrick.NodeTypes = {
		ELEMENT_NODE: 1,
		ATTRIBUTE_NODE: 2,
		TEXT_NODE: 3,
		CDATA_SECTION_NODE: 4,
		ENTITY_REFERENCE_NODE: 5,
		ENTITY_NODE: 6,
		PROCESSING_INSTRUCTION_NODE: 7,
		COMMENT_NODE: 8,
		DOCUMENT_NODE: 9,
		DOCUMENT_TYPE_NODE: 10,
		DOCUMENT_FRAGMENT_NODE: 11,
		NOTATION_NODE: 12,
	};


	// List of categories
	Foxtrick.moduleCategories = {
		INFORMATION_AGGREGATION: 'informationAggregation',
		SHORTCUTS_AND_TWEAKS: 'shortcutsAndTweaks',
		PRESENTATION: 'presentation',
		MATCHES: 'matches',
		FORUM: 'forum',
		LINKS: 'links',
		ALERT: 'alert',
		ACCESSIBILITY: 'accessibility',
	};
})();

if (Foxtrick.arch === 'Gecko') {
	/* jshint ignore:start */
	var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;
	/* jshint ignore:end */
}

if (Foxtrick.platform !== 'Android') {
	// use a remote DataPath for desktop installs unless running from source
	// branch cannot be accessed so early so we need a lazy getter
	(function() {
		var localDataPath = Foxtrick.DataPath;
		var remoteDataPath = 'https://cdn.rawgit.com/minj/foxtrick/res/%d/res/';
		Foxtrick.lazyProp(Foxtrick, 'DataPath', function() {
			if (Foxtrick.branch !== 'dev')
				return remoteDataPath;
			else
				return localDataPath;
		});
	})();
}
