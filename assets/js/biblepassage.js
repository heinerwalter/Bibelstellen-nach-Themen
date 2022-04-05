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
		var str = (this.topicPrimary || '').trim();
		if (!!this.topicsSecondary) {
			var array = this.topicsSecondary.split(',');
			for (var i = 0; i < array.length; i++) {
				array[i] = array[i].trim();
				if (!array[i]) continue;
				if (str) str = str + ',';
				str = str + array[i];
			}
		}
		return str;
	}

	toHTML() {
		var text = (this.text || '').replaceAll(/([0-9]+)/g, '<span class="verse-number">$1</span>');
		return `		<div class="bible-passage" id="${this.referenceShort}" data-topic="${this.topicPrimary}" data-topics=",${this.topicsAll()}," data-translation="${this.translation}" data-rating="${this.rating}" data-is-card="${this.isCard}" data-date="${this.date?.toDateString() || ''}">
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

function findBiblePassage(biblePassages, reference) {
	for (let i = 0, biblePassage; biblePassage = biblePassages[i]; i++) {
		if (biblePassage.referenceShort === reference) return biblePassage;
	}
	return null;
}



/* Update page */

function updateBiblePassagesContainer(biblePassages = []) {
	let biblePassagesContainerElement = document.getElementById('bible-passages');
	if (!biblePassagesContainerElement) return;

	// Clear old content
	biblePassagesContainerElement.innerHTML = '';

	// Fill with given data
	var lastTopic = '';
	var allTopics = [];
	for (var i = 0; i < biblePassages.length; i++) {
		let biblePassage = biblePassages[i];

		// Add topic
		if (!!biblePassage.topicPrimary &&
		    (!lastTopic || lastTopic !== biblePassage.topicPrimary)) {
			biblePassagesContainerElement.innerHTML += biblePassage.topicToHTML();
		}
		lastTopic = biblePassage.topicPrimary;
		if (!allTopics.includes(biblePassage.topicPrimary)) {
			allTopics.push(biblePassage.topicPrimary);
		}

		// Add bible passage
		biblePassagesContainerElement.innerHTML += biblePassage.toHTML();
	}
	
	populateInputFilterTopics(allTopics);
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
