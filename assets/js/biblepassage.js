/* Class BiblePassage */

class BiblePassage {
	constructor(index = 0) {
		this.index = index;
		this.rating = 0;
		this.isCard = false;
		this.date = null;
		this.referenceShort = '';
		this.reference = '';
		this.text = '';
		this.translation = '';
		this.topicPrimary = '';
		this.topicsSecondary = '';
		this.notes = '';
	}

	topicsAll() {
		const set = new Set();
		var t = (this.topicPrimary || '').trim();
		if (t) set.add(t);
		if (!!this.topicsSecondary) {
			var topicsSecondaryArray = this.topicsSecondary.split(',');
			for (var i = 0; i < topicsSecondaryArray.length; i++) {
				t = topicsSecondaryArray[i].trim();
				if (!t) continue;
				set.add(t);
			}
		}
		return Array.from(set);
	}

	topicsAllString() {
		this.topicsAll().join(',');
	}

	toHTML() {
		var text = (this.text || '').replaceAll(/([0-9]+)/g, '<span class="verse-number">$1</span>');
		return `		<div class="bible-passage" id="${this.referenceShort}" data-topic="${this.topicPrimary}" data-topics=",${this.topicsAllString()}," data-translation="${this.translation}" data-rating="${this.rating}" data-is-card="${this.isCard}" data-date="${this.date?.toDateString() || ''}">
			<h3 class="title-reference"><span class="reference"><span class="reference-border">${this.reference}</span><span class="translation">${this.translation}</span></span><span class="topics-secondary">${this.topicsSecondary}</span></h3>
			<p class="text">${text}</p>
		</div>
`
		// <p class="notes">${this.notes}<p>
	}
	
	topicToHTML(topic = this.topicPrimary) {
		return topicToHTML(topic);
	}
}


function topicToHTML(topic) {
	return `		<h2 class="title-topic topic" data-topic="${topic}">${topic}</h2>
`
}

function biblePassagesToHTML(biblePassages = []) {
	let html = '';
	let lastTopic = '';
	
	for (let i = 0; i < biblePassages.length; i++) {
		const biblePassage = biblePassages[i];

		// Add topic
		if (!!biblePassage.topicPrimary &&
		    (!lastTopic || lastTopic !== biblePassage.topicPrimary)) {
			html += biblePassage.topicToHTML();
		}
		lastTopic = biblePassage.topicPrimary;

		// Add bible passage
		html += biblePassage.toHTML();
	}

	return html;	
}


function findBiblePassage(biblePassages, reference) {
	for (let i = 0, biblePassage; biblePassage = biblePassages[i]; i++) {
		if (biblePassage.referenceShort === reference) return biblePassage;
	}
	return null;
}


function sortBiblePassages(biblePassages = [], by = 'topic') {
	switch (by) {
		case 'topic':
			return sortBiblePassagesByTopic(biblePassages);
		default:
			return biblePassages;
	}
}

function sortBiblePassagesByTopic(biblePassages = []) {
	biblePassages.sort(function(a, b) {
		var nameA = a?.topicPrimary || '';
		var nameB = b?.topicPrimary || '';
		if (nameA < nameB) return -1;
		if (nameA > nameB) return 1;
		return 0;
	});
	return biblePassages;
}


/* Update page */

function updateBiblePassagesContainer(biblePassages = []) {
	let biblePassagesContainerElement = document.getElementById('bible-passages');
	if (!biblePassagesContainerElement) return;

	// Fill container with bible passages
	biblePassagesContainerElement.innerHTML = biblePassagesToHTML(biblePassages);

	// Search for all topics of all bible passages
	var allTopics = [];
	for (var i = 0; i < biblePassages.length; i++) {
		Array.prototype.push.apply(allTopics, biblePassages[i].topicsAll());
	}
	// Fill filter input with topics
	populateInputFilterTopics(Array.from(new Set(allTopics)));
}

function populateInputFilterTopics(topics = []) {
	// Populate filter topic select field
	let filterTopicSelectElement = document.getElementById('input-filter-topic');
	if (!filterTopicSelectElement) return;

	filterTopicSelectElement.innerHTML = '<option value="">-- Nach Thema filtern --</option>';
	for (var i=0, topic; topic = topics[i]; i++) {
		let optionElement = document.createElement('option');
		optionElement.value = topic;
		optionElement.innerHTML = topic;
		filterTopicSelectElement.appendChild(optionElement);
	}
}
