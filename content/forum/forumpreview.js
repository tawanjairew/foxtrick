/**
 * forumpreview.js
 * Foxtrick forum post preview
 * @author spambot
 */
////////////////////////////////////////////////////////////////////////////////
var FoxtrickForumPreview = {
    
    MODULE_NAME : "ForumPreview",
    MODULE_AUTHOR : "spambot",
    MODULE_CATEGORY : Foxtrick.moduleCategories.FORUM,
    DEFAULT_ENABLED : true,

    _NEW_MESSAGE_WINDOW : 'ctl00_CPMain_ucEditor_tbBody',
	
    init : function() {
        Foxtrick.registerPageHandler( 'forumWritePost',
                                      FoxtrickForumPreview );
    },

    run : function( page, doc ) {

        switch( page )
        {
            case 'forumWritePost':

                // display templates above the message window
                var msg_window = doc.getElementById(
                            FoxtrickForumPreview._NEW_MESSAGE_WINDOW );
				msg_window.addEventListener( "keyup", FoxtrickForumPreview._preview, false );
				
                var preview_ctrl_div = doc.createElement( "div" );
                preview_ctrl_div.style.marginTop = "1em";
                
                var new_button = doc.createElement( "a" );
                new_button.setAttribute( "href", "javascript:showHide('forum_preview');" );
                new_button.innerHTML = Foxtrickl10n.getString( 'show_preview_from_post' );
                preview_ctrl_div.appendChild( new_button );
                msg_window.parentNode.insertBefore( preview_ctrl_div, msg_window );                 
				                
                var preview_div = doc.createElement( "div" );
                preview_div.id = "forum_preview";
                preview_div.setAttribute( "class", "cfMessageNoAvatar" );
				preview_div.style.display = "none";
                preview_div.style.border = "1px dotted grey";
				preview_div.style.width = "465px";
                preview_div.style.margin = "5px";
				preview_div.style.padding = "10px";
                preview_div.style.background = "#fcf6df";
                
                var preview_message = doc.createElement( "div" );
                preview_message.id = "message_preview";
                preview_message.setAttribute( "class", "message" );
                preview_div.appendChild( preview_message );
                
                msg_window.parentNode.insertBefore( preview_div, msg_window );
                
                break;
        }
    },
	
	change : function( page, doc ) {
	
	},
        
    _preview : function ( ev ) {
		search = new Array(
          
          /\[playerid=(.*?)\]/,
          /\[teamid=(.*?)\]/,
          /\[matchid=(.*?)\]/,
          /\[federationid=(.*?)\]/,
          /\[message=(.*?)\]/,
          /\[leagueid=(.*?)\]/,
          /\[link=(.*?)\]/,

          /\[q\](.*?)\[\/q\]/,
          /\[b\](.*?)\[\/b\]/,
          /\[u\](.*?)\[\/u\]/,
          /\[i\](.*?)\[\/i\]/,
          /\[br\]/,
          /\[hr\]/
          );

        replace = new Array(
          "<a href=\"#\" >($1)</a>",
          "<a href=\"#\" >($1)</a>",
          "<a href=\"#\" >($1)</a>",
          "<a href=\"#\" >($1)</a>",
          "<a href=\"#\" >($1)</a>",
          "<a href=\"#\" >($1)</a>",
          "<a href=\"#\" >($1)</a>",

          "<span class='quote'>$1</span>",
          "<b>$1</b>",
          "<u>$1</u>",
          "<i>$1</i>",
          "<br>",
          "<hr>"
        );
       
        var doc = ev.target.ownerDocument;
		var msg_window = doc.getElementById( FoxtrickForumPreview._NEW_MESSAGE_WINDOW );
        var prev_div = doc.getElementById( "forum_preview" );
        var text = Foxtrick.stripHTML( msg_window.value );
        
        text = text.replace(/\n/g, "<br />");
        for (var j = 0; j < text.length; j++) {
            for ( var i = 0; i < search.length; i++) {
                text = text.replace(search[i],replace[i]);
            }
        }   
        
        prev_div.innerHTML = text;
        
    },

};

