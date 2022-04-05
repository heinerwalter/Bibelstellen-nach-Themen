/* Class BiblePassageList */

class BiblePassageList {
	constructor(index = 0) {
		this.index = index;
		this.date = 0;
		this.title = '';
		/**
		 * String content values with format:
		 * - "# topic"
		 * - "bible passage reference"
		 * - "> comment"
		 * - ">- comment (list)"
		 * Format within comments:
		 * - "_underlined_"
		 * - "*italic*"
		 * - "**bold**"
		 * - "***bold and italic***"
		 */
		this.content = [];
	}
	
	dateAndTitleToString() {
		if (!this.date)
			return this.title?.trim() || '';
		if (!this.title?.trim())
			return dateToString(this.date);
		return dateToString(this.date) + ' ' + this.title.trim();
	}

	titleToHTML() {
		return `		<h1 id="title-bible-passage-list" class="title title-bible-passage-list"><span class="title">${markdownToHtml(this.title)}</span><span class="date">${dateToString(this.date)}</span></h1>
`;
	}

	toHTML(includeTitle = false) {
		let html = '';
		html += `	<div class="bible-passage-list">
`

		if (includeTitle)
			html += this.titleToHTML();

		let isList = false;
		this.content.forEach(contentLine => {
			const parsed = biblePassageListContentLineToHTML(contentLine);
			if (parsed['isList'] && !isList) {
				html += `		<ul class="comment-list">
`;
				isList = true;
			} else if (!parsed['isList'] && isList) {
				html += `		</ul>
`;
				isList = false;
			}
			html += parsed.html;
		});
		if (isList) {
			html += `		</ul>
`;
		}
		html += `	</div>
`
		return html;
	}
}

function dateToString(date) {
	if (!date) return '';
	var options = { day: '2-digit', month: '2-digit', year: 'numeric' };
	return date.toLocaleDateString("de-DE", options);
}

function markdownToHtml(markdown) {
	return markdown?.replace(/_([^_]+)_/g, '<span class="underline">$1</span>')
		.replace(/\*\*\*(.+)\*\*\*/g, '<strong><em>$1<em></strong>')
		.replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+)\*/g, '<em>$1<em>') || '';
}

/**
 * Returns a list [type, value] where type is one of:
 * - 'topic'
 * - 'reference'
 * - 'comment'
 * - 'comment-list'
 * - 'empty'
 */
function biblePassageListParseContentLine(contentLine) {
	if (!contentLine?.trim())
		return ['empty', ''];
	contentLine = contentLine.trim();

	const prefix = contentLine.split(' ', 1)[0];
	const suffix = contentLine.substr(prefix.length).trim();
	switch (prefix) {
		case '#':
			return ['topic', suffix];
		case '>':
			return ['comment', suffix];
		case '>-':
			return ['comment-list', suffix];
	}
	
	return ['reference', contentLine];
}

function biblePassageListContentLineToHTML(contentLine) {
	const [type, value] = biblePassageListParseContentLine(contentLine);
	switch (type) {
		case 'topic':
			return {html: topicToHTML(value)};
		case 'reference': 
			const biblePassage = findBiblePassage(biblePassages, value);
			return {html: biblePassage?.toHTML() || ''};
		case 'comment':
			return {html: `		<p class="comment">${markdownToHtml(value)}</p>
`};
		case 'comment-list':
			return {html: `			<li class="comment comment-list-item">${markdownToHtml(value)}</li>
`, isList: true};
		case 'empty':
			return {html: ''};
 	}
 
 	// Invalid type
 	console.error('Invalid bible passage list content type', type, value);
}



/* Update page */

function populateInputFilterLists(biblePassageLists = []) {
	// Populate filter list select field
	let filterListSelectElement = document.getElementById('input-filter-list');
	if (!filterListSelectElement) return;

	filterListSelectElement.innerHTML = '<option value="">-- Liste anzeigen --</option>';
	for (var i=0, list; list = biblePassageLists[i]; i++) {
		let optionElement = document.createElement('option');
		optionElement.value = list.index;
		optionElement.innerHTML = list.dateAndTitleToString();
		filterListSelectElement.appendChild(optionElement);
	}
}

