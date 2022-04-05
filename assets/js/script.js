window.onload = function() {
	// Initialize layout check boxes:
	const contentElement = document.getElementById('content');
	// two-columns
	let isTwoColumns = contentElement?.classList.contains('two-columns') || false;
	const inputTwoColumnsElement = document.getElementById('input-two-columns');
	if (inputTwoColumnsElement) inputTwoColumnsElement.checked = inputTwoColumnsElement;
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
	// Try to find existing style element for filtering topics
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
			/* Filter topics by name */
			.bible-passages .title-topic,
			.bible-passages .bible-passage {
				display: none;
			}
			/*.bible-passages .title-topic[data-topic="` + topic + `"],*/
			.bible-passages .bible-passage[data-topics*=",` + topic + `,"] {
				display: inherit;
			}
			`;
		contentElement?.setAttribute('data-filter-topic', topic);
	} else {
		styleElement.innerHTML = '';
		contentElement?.removeAttribute('data-filter-topic');
	}
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
		let workbook = XLSX.readFile(data);
		if (!workbook) {
			event.target.value = null;
			return;
		}
		excelFileLoaded(workbook);
	};
	reader.onerror = function() {
		event.target.value = null;
	}
	reader.readAsArrayBuffer(file);
}

function excelFileResetClicked(event) {
	if (!!event) event.preventDefault();

	excelFileReset();
}



/* Excel file handling */

var excelWorkbook = null;
var excelWorksheetBiblePassages = null;
var excelWorksheetBiblePassageLists = null;
var biblePassages = [];
var biblePassageLists = [];

function excelFileReset() {
	excelWorkbook = null;
	excelWorksheetBiblePassages = null;
	excelWorksheetBiblePassageLists = null
	biblePassages = [];
	biblePassageLists = [];

	let fileInputElement = document.getElementById('input-excel-file');
	if (!!fileInputElement)
		fileInputElement.value = null;

	updateBiblePassagesContainer([]);
	populateInputFilterLists([]);
	setControlAreaContentImport();
}

function excelFileLoaded(workbook) {
	excelWorkbook = workbook;
	excelWorksheetBiblePassages = workbook.Sheets['Bibelstellen'];
	excelWorksheetBiblePassageLists = workbook.Sheets['Listen'];

	// Read all bible passages from excel
	biblePassages = [];
	if (!!excelWorksheetBiblePassages) {
		for (let i = 0; ; i++) {
			let biblePassage = excelReadBiblePassage(excelWorksheetBiblePassages, i);
			if (!biblePassage) break;
			biblePassages.push(biblePassage);
		}
	}

	// Read all bible passage lists from excel
	biblePassageLists = [];
	if (!!excelWorksheetBiblePassageLists) {
		for (let i = 0; ; i++) {
			let biblePassageList = excelReadBiblePassageList(excelWorksheetBiblePassageLists, i);
			if (!biblePassageList) break;
			biblePassageLists.push(biblePassageList);
		}
	}

	updateBiblePassagesContainer(biblePassages);
	populateInputFilterLists(biblePassageLists);
	setControlAreaContentFilter();
}

function excelDateToJSDate(serial) {
   var utc_days  = Math.floor(serial - 25569);
   var utc_value = utc_days * 86400;                                        
   var date_info = new Date(utc_value * 1000);

   var fractional_day = serial - Math.floor(serial) + 0.0000001;
   var total_seconds = Math.floor(86400 * fractional_day);
   var seconds = total_seconds % 60;
   total_seconds -= seconds;

   var hours = Math.floor(total_seconds / (60 * 60));
   var minutes = Math.floor(total_seconds / 60) % 60;

   return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

/**
 * @param worksheet
 *     The excel worksheet object.
 * @param object
 *     The object to be filled from excel data.
 * @param indicesDefinition
 *     indicesDefinition = {key: {i: 1, default: ''}, ...} or
 *     indicesDefinition = {key: {i: 1, converter: (value) => ...}, ...}
 * @param cellAddressFunction
 *     A function receiving an excel row or column index number and returning a cell address. E.g.:
 *     cellAddressFunction = (index) => XLSX.utils.encode_cell({c: index - 1, r: row + excelBiblePassageRowOffset})
 */
function excelReadIndex(worksheet, object, indicesDefinition, cellAddressFunction) {
	for (key in indicesDefinition) {
		// Get values of the index definition dictionary
		const indexDefinition = indicesDefinition[key]
		const index = indexDefinition['i'];
		const defaultValue = indexDefinition['default'];
		const converterFunction = indexDefinition['converter'];
		// Get value of excel cell
		const cellAddress = cellAddressFunction(index);
		object[key] = worksheet[cellAddress]?.v;
		// Handle value conversion and empty values
		if (!!converterFunction)
			object[key] = converterFunction(object[key]);
		else if (!object[key])
			object[key] = defaultValue
	}
}


const excelBiblePassageColumnIndices = {
	rating: {i: 1, default: 0},
	isCard: {i: 2, converter: (value) => value === 1},
	date: {i: 3, converter: (value) => !value ? null : excelDateToJSDate(value)},
	referenceShort: {i: 4, default: ''},
	reference: {i: 30, default: ''},
	text: {i: 5, default: ''},
	translation: {i: 6, default: ''},
	topicPrimary: {i: 10, default: ''},
	topicsSecondary: {i: 8, default: ''},
	notes: {i: 9, default: ''},
};
const excelBiblePassageRowOffset = 1;

function excelReadBiblePassage(worksheet, row) {
	// Create empty object
	var biblePassage = new BiblePassage(row);
	// Read cells defined by indices dictionary
	excelReadIndex(worksheet, biblePassage, excelBiblePassageColumnIndices,
		(index) => XLSX.utils.encode_cell({c: index - 1, r: row + excelBiblePassageRowOffset}));

	if (!biblePassage.referenceShort && !biblePassage.text)
		return null;
	return biblePassage;
}



const excelBiblePassageListRowIndices = {
	date: {i: 1, converter: (value) => !value ? null : excelDateToJSDate(value)},
	title: {i: 2, default: ''},
};
const excelBiblePassageListFirstRowIndexContent = 3;
const excelBiblePassageListColumnOffset = 1;

function excelReadBiblePassageList(worksheet, column) {
	// Create empty object
	var biblePassageList = new BiblePassageList(column);
	// Read cells defined by indices dictionary
	excelReadIndex(worksheet, biblePassageList, excelBiblePassageListRowIndices,
		(index) => XLSX.utils.encode_cell({c: column + excelBiblePassageListColumnOffset, r: index - 1}));

	// Read content cells
	for (let row = excelBiblePassageListFirstRowIndexContent; ; row++) {
		const cellAddress = XLSX.utils.encode_cell({c: column + excelBiblePassageListColumnOffset, r: row - 1})
		const value = worksheet[cellAddress]?.v?.toString() || '';
		if (!value) break;
		biblePassageList.content.push(value);
	}

	if (!biblePassageList.content?.length ||
		(!biblePassageList.date && !biblePassageList.title))
		return null;
	return biblePassageList;
}