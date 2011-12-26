import HTMLParser
import re
# Parses menu links from hattrick sourcecode.
# Used to automatically validate htlang.xml
# 
# CatzHoek

class MenuParser(HTMLParser.HTMLParser):
	def __init__(self):
		HTMLParser.HTMLParser.__init__(self)
		self.in_mainnav_menu_div = False
		self.in_link = False
		self.entries = {}
		self.currentlink = None
	
	def handle_starttag(self, tag, attrs):
		# find out which section is next, <a name="" is our keyword
		if tag == 'a':
			if self.in_mainnav_menu_div:
				for name, value in attrs:
					if name == 'href':
						self.in_link = True
						self.currentlink = value
						
		if tag == 'div':
			self.in_mainnav_menu_div = False
			for name, value in attrs:
				if name == 'id' and value == 'menu':
					self.in_mainnav_menu_div = True
		
	def handle_endtag(self, tag):
		if tag == 'a':
			self.in_link = False
			
	def getHtXmlTagForUrl(self, url):
		if re.search("Club", url):
			return "MyClub";
		elif re.search("MyHattrick", url):
			return "MyHattrick";
		elif re.search("Forum", url):
			return "Forum";
		elif re.search("World", url):
			return "World";
		elif re.search("Shop", url):
			return "Shop";
		elif re.search("Help", url):
			return "Help";
		else:
			return None;
		
			
	def handle_data(self, data):
		#gather string
		if self.in_link:
			str = data.lstrip().rstrip()
			menulink = self.getHtXmlTagForUrl(self.currentlink)
			if menulink:
				self.entries[menulink] = str
			
	def get(self):
		return self.entries