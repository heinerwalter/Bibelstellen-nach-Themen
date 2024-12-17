/* Excel file handling */

/** Read excel file using the xlsx js library (https://www.npmjs.com/package/xlsx). */
function excelFileInputProcess(fileData) {
	if (!fileData) return false;

	const workbook = XLSX.readFile(fileData);
	if (!workbook) return false;
	excelFileLoaded(workbook);
	return true;
}

var excelWorkbook = null;
var excelWorksheetBiblePassages = null;
var excelWorksheetBiblePassageLists = null;
var biblePassages = [];
var biblePassageLists = [];

/**
 * Invoked by the user to clear the display of a previously loaded excel document.
 */
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

/**
 * Invoked after the xlsx js library has read an excel document.
 * This function reads and displays its' content.
 * @param workbook
 *        The loaded excel workbook object.
 */
function excelFileLoaded(workbook) {
	excelWorkbook = workbook;
	excelWorksheetBiblePassages = workbook.Sheets['Bibelstellen'];
	excelWorksheetBiblePassageLists = workbook.Sheets['Listen'];

	// Read all bible passages from excel
	biblePassages = [];
	if (!!excelWorksheetBiblePassages) {
		excelReadColumnIndicesByTitle(excelWorksheetBiblePassages, excelBiblePassageColumnIndices, excelBiblePassageTitleRowIndex)
		for (let i = 0; ; i++) {
			let biblePassage = excelReadBiblePassage(excelWorksheetBiblePassages, i);
			if (!biblePassage) break;
			biblePassages.push(biblePassage);
		}
	}
	sortBiblePassages(biblePassages, 'topic');

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

function excelCommaSeparatedStringToStringArray(value) {
	if (!value) return [];
        if (typeof value != 'string') return [value.toString()];
        return value.split(',')
		.map(i => i.trim())
		.filter(i => !!i);
}

function excelCommaSeparatedStringToIntArray(value) {
	const array = excelCommaSeparatedStringToStringArray(value);
        return array.map(i => parseInt(i));
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
 * This function searches the title row for the column titles defined in indicesDefinition.
 * When a column title is found, its' index is saved to the same column in indicesDefinition.
 * This way the column indices must not be hard coded and can differ between different documents
 * as long as the column titles match.
 * Columns which were not found in the given worksheet remain unchanged.
 * @param worksheet
 *        The excel worksheet object.
 * @param indicesDefinition
 *        A dictionary containing a mapping of object properties (key) with column indices (i) and titles:
 *        indicesDefinition = {key: {i: 1, title: '...', ...}, ...}
 * @param titleRowIndex
 *        Index of the row containing column titles (starting with 1).
 */
function excelReadColumnIndicesByTitle(worksheet, indicesDefinition, titleRowIndex) {
	// Iterate over all columns as long as the title is not empty
	for (var i = 1; ; i++) {
		// Get value of excel cell
		const cellAddress = XLSX.utils.encode_cell({c: i - 1, r: titleRowIndex - 1});
		const title = worksheet[cellAddress]?.v;
		if (!title)
			// Stop after finding an empty cell
			return;
		
		// Search for this title value in indicesDefinition
		for (key in indicesDefinition) {
			if (key.title == title) {
				// Found matching definition => save index
				key.i = i;
				//break;
			}
		}
	}
}

/**
 * @param worksheet
 *        The excel worksheet object.
 * @param object
 *        The object to be filled from excel data.
 * @param indicesDefinition
 *        A dictionary containing a mapping of object properties (key) with column or row indices (i):
 *        indicesDefinition = {key: {i: 1, title: '...', default: ''}, ...} or
 *        indicesDefinition = {key: {i: 1, title: '...', converter: (value) => ...}, ...}
 * @param cellAddressFunction
 *        A function receiving an excel row or column index number (from indicesDefinition)
 *        and returning a cell address. E.g.:
 *        cellAddressFunction = (index) => XLSX.utils.encode_cell({c: index - 1, r: row + excelBiblePassageContentRowOffset})
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
			object[key] = defaultValue;
	}
}

function excelReadBiblePassage(worksheet, row) {
	// Create empty object
	var biblePassage = new BiblePassage(row);
	// Read cells defined by indices dictionary
	excelReadIndex(worksheet, biblePassage, excelBiblePassageColumnIndices,
		(index) => XLSX.utils.encode_cell({c: index - 1, r: row + excelBiblePassageContentRowOffset}));

	if (!biblePassage.referenceShort && !biblePassage.text)
		return null;
	return biblePassage;
}

function excelReadBiblePassageList(worksheet, column) {
	// Create empty object
	var biblePassageList = new BiblePassageList(column);
	// Read cells defined by indices dictionary
	excelReadIndex(worksheet, biblePassageList, excelBiblePassageListRowIndices,
		(index) => XLSX.utils.encode_cell({c: column + excelBiblePassageListContentColumnOffset, r: index - 1}));

	// Read content cells
	for (let row = excelBiblePassageListFirstRowIndexContent; ; row++) {
		const cellAddress = XLSX.utils.encode_cell({c: column + excelBiblePassageListContentColumnOffset, r: row - 1})
		const value = worksheet[cellAddress]?.v?.toString() || '';
		if (!value) break;
		biblePassageList.content.push(value);
	}

	if (!biblePassageList.content?.length ||
		(!biblePassageList.date && !biblePassageList.title))
		return null;
	return biblePassageList;
}
