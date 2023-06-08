window.onload = function() {
	// Initialize layout check boxes:
	const contentElement = document.getElementById('content');
	// two-columns
	let isTwoColumns = contentElement?.classList.contains('two-columns') || false;
	const inputTwoColumnsElement = document.getElementById('input-two-columns');
	if (inputTwoColumnsElement) inputTwoColumnsElement.checked = inputTwoColumnsElement;

	// Get URL query parameters:
	const params = new Proxy(new URLSearchParams(window.location.search), {
		get: (searchParams, prop) => searchParams.get(prop),
	});
	// Load excel file with given URL
	let excelFile = params.excelfile;
	const excelFileInputElement = document.getElementById('input-excel-file');
	if (excelFile && excelFileInputElement) {
		// TODO
		//alert("Load " + excelFile);
		// Fetch data of file from URL
		fetch(excelFile)
			.then(res => res.blob())
			.then(blob => {
				excelFileInputProcess(blob);
			});
	}
};



/* control area */

function setControlAreaContent(content) { // content: 'import', 'filter'
	let controlAreaElement = document.getElementById('control-area');
	if (!controlAreaElement) return;

	if (!content)
		controlAreaElement.removeAttribute('data-control-area-content');
	else
		controlAreaElement.setAttribute('data-control-area-content', content);
}

function setControlAreaContentImport() {
	setControlAreaContent('import');
}

function setControlAreaContentFilter() {
	setControlAreaContent('filter');
}



/* filter */

function filterTopics(topic) {
	/*// Try to find existing style element for filtering topics
	var styleElement = document.getElementById('filter-topics-by-name');
	const contentElement = document.getElementById('content');
	if (styleElement === null) {
		// Create new style element if it does not exist yet
		styleElement = document.createElement('style');
		styleElement.id = 'filter-topics-by-name';
		document.head.appendChild(styleElement);
	}

	// Fill style element with topic filtering rules
	if (!!topic) {
		styleElement.innerHTML = `
			.bible-passages .title-topic,
			.bible-passages .bible-passage {
				display: none;
			}
			.bible-passages .bible-passage[data-topics*=",` + topic + `,"] {
				display: inherit;
			}
			`;
		contentElement?.setAttribute('data-filter-topic', topic);
	} else {
		styleElement.innerHTML = '';
		contentElement?.removeAttribute('data-filter-topic');
	}*/

	// Get content element
	const contentElement = document.getElementById('content');
	const biblePassagesElement = document.getElementById('bible-passages');
	if (!contentElement) return;

	if (!topic) {
		updateBiblePassagesContainer(biblePassages);
		contentElement.removeAttribute('data-filter-topic');
		return;
	}

	// Replace content elements content by bible passages with the selected topic
	biblePassagesElement.innerHTML = biblePassagesWithTopicToHTML(topic, biblePassages);
	contentElement.setAttribute('data-filter-topic', topic);
}

function filterLists(listIndex) {
	// Get content element
	const contentElement = document.getElementById('content');
	const biblePassagesElement = document.getElementById('bible-passages');
	if (!contentElement) return;

	const list = biblePassageLists[listIndex];
	if (!biblePassageLists || !list) {
		updateBiblePassagesContainer(biblePassages);
		contentElement.removeAttribute('data-filter-list');
		return;
	}

	// Replace title element
	document.getElementById('title-bible-passage-list')?.remove();
	biblePassagesElement.insertAdjacentHTML('beforebegin', list.titleToHTML());

	// Replace content elements content by the selected list
	biblePassagesElement.innerHTML = list.toHTML();
	contentElement.setAttribute('data-filter-list', listIndex);
}



/* Event handling */

function filterTopicInputChanged(event) {
	if (!event) return;
	event.preventDefault();

	if (!event.target) return;
	filterTopics(event.target.value || null);
}

function filterListInputChanged(event) {
	if (!event) return;
	event.preventDefault();

	if (!event.target) return;
	filterLists(event.target.value || null);
}

function layoutTwoColumnsChanged(event) {
	if (!event) return;
	event.preventDefault();

	if (!event.target) return;
	const contentElement = document.getElementById('content');
	if (!contentElement) return;
	contentElement.classList.toggle('two-columns', event.target.checked);
}


function excelFileInputChanged(event) {
	if (!event) return;
	event.preventDefault();

	if (!event.target || !event.target.files || !event.target.files.length) return;
	let file = event.target.files[0];
	
	// Read selected file data
	let reader = new FileReader();
	reader.onload = function() {
		let data = reader.result;
		// Read excel file using the xlsx js library (https://www.npmjs.com/package/xlsx)
		if (!excelFileInputProcess(data)) {
			event.target.value = null;
			return;
		}
	};
	reader.onerror = function() {
		event.target.value = null;
	}
	reader.readAsArrayBuffer(file);
}

zoomFactor = 1.0;

function decreaseFontSizeClicked(event) {
	if (!!event) event.preventDefault();

	zoomFactor -= 0.1;
	document.body.style.zoom = zoomFactor;
}

function increaseFontSizeClicked(event) {
	if (!!event) event.preventDefault();

	zoomFactor += 0.1;
	document.body.style.zoom = zoomFactor;
}

function excelFileResetClicked(event) {
	if (!!event) event.preventDefault();

	excelFileReset();
}
