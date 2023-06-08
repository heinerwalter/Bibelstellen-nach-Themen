/*
 * `indicesDefinition = {
 *     key: {i: 1, default: ''},
 *     ...
 * }`
 * or
 * `indicesDefinition = {
 *     key: {i: 1, converter: (value) => ...},
 *     ...
 * }`
 *
 * i: Index of the Excel row or column (starting with 1).
 * converter (optional): A function receiving the Excel cell value as parameter and returning a value to be used instead.
 * default (optional): Value used if a Excel cell value evaluates to false and no converter is given.
 */
 

// Bible Passages:

const excelBiblePassageColumnIndices = {
	rating: {i: 1, title: 'Bewertung', default: 0},
	isCard: {i: 2, title: 'Karte', converter: (value) => value === 1},
	isWall: {i: 3, title: 'Wand', converter: (value) => value === 1},	
	date: {i: 4, title: 'seit', converter: (value) => !value ? null : excelDateToJSDate(value)},
	referenceShort: {i: 5, title: 'Referenz', default: ''},
	reference: {i: 34, title: 'Referenz (bereinigt)', default: ''},
	text: {i: 6, title: 'Text', default: ''},
	translation: {i: 7, title: 'Übersetzung', default: ''},
	topicPrimary: {i: 13, title: 'Thema (ohne Nummer)', default: ''},
	topicsSecondary: {i: 9, title: 'Weitere Themen', default: ''},
	notes: {i: 10, title: 'Notizen', default: ''},
	favoritesInYear: {i: 11, title: 'Favoriten im Jahr', converter: (value) => excelCommaSeparatedStringToIntArray(value)},
	orderTopic: {i: 17, title: 'Reihenfolge (Thema)', default: 999999},
	orderBible: {i: 33, title: 'Reihenfolge (Bibelstelle)', default: 999999999},
};
const excelBiblePassageTitleRowIndex = 1;
const excelBiblePassageContentRowOffset = 1;


// Bible Passage Lists:

const excelBiblePassageListRowIndices = {
	date: {i: 1, converter: (value) => !value ? null : excelDateToJSDate(value)},
	title: {i: 2, default: ''},
	important: {i: 3, converter: (value) => typeof value == 'string' ? !!value?.trim() : !!value},
};
const excelBiblePassageListFirstRowIndexContent = 4;
const excelBiblePassageListContentColumnOffset = 1;
