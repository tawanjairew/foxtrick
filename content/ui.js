"use strict";
/**
* ui.js
* UserInterfaces
* @author convincedd
*/

Foxtrick.modules.UI = {
	CORE_MODULE : true,
	PAGES : ["all"],

	// called on browser load (from background context for sandboxed)
	onLoad : function(document) {},

	// gecko only
	onTabChange : function(document) {},
	
	// called with DomContentLoaded for Firefox & Fennec
	// called with pageLoad request in background context for sandboxed)
	// all: called when en/disabling 
	update : function(sender) {},
};



// browser specific implementations 
if (Foxtrick.platform == "Firefox") {

	// called after browser loaded , with browser chrome
	// as the argument
	// initializes items in menu bar and status bar
	Foxtrick.modules.UI.onLoad = function(document) {

		// to add FoxTrick button on the navigation bar by default
		if (!FoxtrickPrefs.getBool("toolbarInited")) {
			var buttonId = "foxtrick-toolbar-button"; // ID of FoxTrick button
			var afterId = "search-container"; // insert after search box
			var navBar = document.getElementById("nav-bar");
			var curSet = navBar.currentSet.split(",");

			if (curSet.indexOf(buttonId) == -1) {
				var pos = curSet.indexOf(afterId) + 1 || curSet.length;
				var set = curSet.slice(0, pos).concat(buttonId).concat(curSet.slice(pos));

				navBar.setAttribute("currentset", set.join(","));
				navBar.currentSet = set.join(",");
				document.persist(navBar.id, "currentset");
				try {
					BrowserToolboxCustomizeDone(true);
				}
				catch (e) {}
			}
			FoxtrickPrefs.setBool("toolbarInited", true);
		}

		// toolbar menu - preferences
		var toolbarPreferences = document.getElementById("foxtrick-toolbar-preferences");
		toolbarPreferences.label = Foxtrickl10n.getString("toolbar.preferences");
		// toolbar menu - disable
		var toolbarDisable = document.getElementById("foxtrick-toolbar-deactivate");
		toolbarDisable.label = Foxtrickl10n.getString("toolbar.disableTemporary");
		// toolbar menu - clearCache
		var clearCache = document.getElementById("foxtrick-toolbar-clearCache");
		clearCache.label = Foxtrickl10n.getString("api.clearCache");
		// toolbar menu - highlight
		var toolbarHighlight = document.getElementById("foxtrick-toolbar-highlight");
		toolbarHighlight.label = Foxtrickl10n.getString("toolbar.featureHighlight");
		// toolbar menu - translationKeys
		var toolbarTranslationKeys = document.getElementById("foxtrick-toolbar-translationKeys");
		toolbarTranslationKeys.label = Foxtrickl10n.getString("toolbar.translationKeys");
		// update status icon
		Foxtrick.modules.UI.update();
	};

	Foxtrick.modules.UI.onTabChange = function(document) {
		Foxtrick.modules.UI.update();
	};
	
	Foxtrick.modules.UI.update = function() {
		Foxtrick.modules.UI.updateIcon();
	},
	
	Foxtrick.modules.UI.updateIcon = function() {

		var disableItem = document.getElementById("foxtrick-toolbar-deactivate");
		if (disableItem)
			disableItem.setAttribute("checked", FoxtrickPrefs.getBool("disableTemporary"));

		var highlightItem = document.getElementById("foxtrick-toolbar-highlight");
		if (highlightItem)
			highlightItem.setAttribute("checked", FoxtrickPrefs.getBool("featureHighlight"));

		var translationKeysItem = document.getElementById("foxtrick-toolbar-translationKeys");
		if (translationKeysItem)
			translationKeysItem.setAttribute("checked", FoxtrickPrefs.getBool("translationKeys"));

			var button = document.getElementById("foxtrick-toolbar-button");
		if (!button || !content)
			return;
		var doc = content.document; // get the document of current tab

		var statusText;
			
		if (FoxtrickPrefs.getBool("disableTemporary")) {
			// FoxTrick is disabled temporarily
			button.setAttribute("status", "disabled");
			statusText = Foxtrickl10n.getString("status.disabled");
		}
		else if (Foxtrick.isHt(doc)
			&& !(FoxtrickPrefs.getBool("disableOnStage") && Foxtrick.isStage(doc))) {
			// FoxTrick is enabled, and active on current page
			button.setAttribute("status", "active");
			statusText = Foxtrickl10n.getString("status.active");
		}
		else {
			// FoxTrick is enabled, but not active on current page
			button.setAttribute("status", "enabled");
			try { 
				// it's called twice in ff3.6 and works with one of the calls, thus display is fine
				// the other raises an error. dunno why and found no proper checks	
				var hostname = doc.location.hostname;
			} catch (e) {}
			statusText = Foxtrickl10n.getString("status.enabled").replace("%s", hostname);
		}
		var tooltipText = Foxtrickl10n.getString("toolbar.title") + " " + Foxtrick.version() + " (" + statusText + ")";
		button.setAttribute("tooltiptext", tooltipText);
	};
}


if (Foxtrick.platform == "Opera") {

	Foxtrick.modules.UI.UIItemProperties = {
		disabled: false,
		title: "FoxTrick",
		icon: "skin/icon-16.png",
		popup: {
			href: 'popup-opera.html',
			width: 200,
			height: 100
		},
		onclick: function(event) {
			Foxtrick.modules.UI.button.popup.width=200;
			Foxtrick.modules.UI.button.popup.height=100;
			//FoxtrickPrefs.disable(event.currentTarget);
		}
		
	};

	Foxtrick.modules.UI.onLoad = function() {
		// Specify the properties of the button before creating it.
		// Create the button and add it to the toolbar.
		Foxtrick.modules.UI.button = opera.contexts.toolbar.createItem( Foxtrick.modules.UI.UIItemProperties );
		opera.contexts.toolbar.addItem(Foxtrick.modules.UI.button);
		Foxtrick.modules.UI.updateIcon(Foxtrick.modules.UI.button);
	};
	
	Foxtrick.modules.UI.update = function() {
		Foxtrick.modules.UI.updateIcon(Foxtrick.modules.UI.button);
	};
	
	Foxtrick.modules.UI.updateIcon = function(button) {
		var icon = '', statusText= '';
		if (FoxtrickPrefs.getBool("disableTemporary")) {
			button.icon = "skin/disabled-24.png";
			statusText = Foxtrickl10n.getString("status.disabled");
		}
		else {
			statusText = Foxtrickl10n.getString("status.active");
			button.icon = "skin/icon-24.png";
		}
		var tooltipText = Foxtrickl10n.getString("toolbar.title") + " " + Foxtrick.version() + " (" + statusText + ")";
		button.title = tooltipText;
	};
}


else if (Foxtrick.platform == "Chrome") {

	Foxtrick.modules.UI.onLoad = function() {
		chrome.pageAction.onClicked.addListener(function(tab) { 
			FoxtrickPrefs.disable(tab); 
		});
	};

	Foxtrick.modules.UI.update = function(tab) {
		Foxtrick.modules.UI.updateIcon(tab);
	};
	
	Foxtrick.modules.UI.updateIcon = function(tab) {
		if (!tab || !tab.id)
			return;
		chrome.pageAction.show(tab.id);
		var iconUrl = '', statusText = '';
		if (FoxtrickPrefs.getBool("disableTemporary")) {
			iconUrl = "../skin/disabled-24.png";
			statusText = Foxtrickl10n.getString("status.disabled");
		}
		else {
			iconUrl = "../skin/icon-24.png";
			statusText = Foxtrickl10n.getString("status.active");
		}
		var tooltipText = Foxtrickl10n.getString("toolbar.title") + " " + Foxtrick.version() + " (" + statusText + ")";
		chrome.pageAction.setIcon({tabId : tab.id, path : iconUrl});
		chrome.pageAction.setTitle({tabId : tab.id, title: tooltipText})
	};
}


else if (Foxtrick.platform == "Safari") {

	Foxtrick.modules.UI.onLoad = function() {
	   // Open Options page upon settings checkbox click.
		safari.extension.settings.openFoxtrickOptions = false;
		safari.extension.settings.addEventListener("change", function(e) {
			 if (e.key == 'openFoxtrickOptions')
				sandboxed.tabs.create({url: Foxtrick.InternalPath + "preferences.html"});
		}, false);
	};
}


else if (Foxtrick.platform == "Fennec") {
}