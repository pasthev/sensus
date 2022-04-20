// « non verbum e verbo sed sensum de sensu »

/* Todo:
			- handle <Return> keypresses
			- copy button in Commands panel does nothing yet -> copy as Lirc txt file ?
			- return false from all ui_ functions (in case form would be used in an iframe, i.e. in Google Sites)
			- search hardcoded "var freq = 38029"
			- freqSetLirc to cleanup, 
			- *Setting Decimal frequency only changes freq byte, not values !
			- All '// return false;' at the end of ui_ functions to be deleted / corrected (was initially meant for Google Sites embedding)
 */

const MAX_FACTOR = 5;                      // defines max factor value between zeros and ones in commands
const FREQ36 = 36045;                      // Most common IR frequencies
const FREQ38 = 38029;                      //
const FREQ40 = 40244;                      //
const BRDLNK_UNIT = 269 / 8192;            // Broadlink 32.84ms time units, or 2^-15s ;
const NEC = 'Nec', ONEHOT = 'One-Hot';     // Just to make function calls a bit more understandable
var output = '';                           // Buffer for output message in log window
const activeDebug = false
 

// Interface functions --------------------------------------------------------------------------------------------------->	

function setField(name, val) {             // Fills textarea named 'name' with 'val'
	if (typeof val === 'undefined') {
		document.getElementById(name).value = '';
	} else {
		document.getElementById(name).value = val;
	}
}
function clrField(name) {                  // Clears textarea named 'name'
		document.getElementById(name).value = '';
}
function getField(name) {                  // Returns content of 'name' html field
	return document.getElementById(name).value
}
function setFocus(name) {                  // Returns content of 'name' html field
	document.getElementById(name).focus();
}
function cleanOnClick() {                  // Cleanup tasks on button clicks, i.e. close msg popup if any
	output = '';
	closeMsg();
}
function ui_clear(fieldId) {               // Clears field with id string fieldId and sets focus on it
	cleanOnClick();
	if (fieldId == 'Commands') {
		clrField('cPreField');
		clrField('cHeaderField');
		clrField('cOneField');
		clrField('cZeroField');
		clrField('cPtrailField');
		clrField('cGapField');
		clrField('cFreqField');
		clrField('cShortField');
		clrField('cCommandField');
		setFocus('cShortField');
	} else {
		clrField(fieldId);
		setFocus(fieldId);
	}
		// return false;
}
function ui_copy(fieldId) {                // Copies string from field with id string fieldId to clipboard
	cleanOnClick();
	copyToClipboard(getField(fieldId));
	// return false;
}
function ui_copyPrefixed(fieldId) {        // Copies string from field with id string fieldId to clipboard, adding prefix 'hex2send:'
	cleanOnClick();
	let jeedom = 'hex2send:' + getField(fieldId);
	copyToClipboard(jeedom);
	// return false;
}
function ui_copyLirc() {                   // Turns Commands into a Lirc txt, and copies it to clipboard
	cleanOnClick();

	let header = getField('cHeaderField');
	let one = getField('cOneField');
	let zero = getField('cZeroField');
	let ptrail = getField('cPtrailField');
	let gap = getField('cGapField');
	let pre = getField('cPreField');
	let freq = getField('cFreqField');
	let lircCommand = getField('cCommandField');
	
	if (lircCommand == '') {
		shortToCommand();
		lircCommand = getField('cCommandField');
	}


	let lirc = ``;	
	
	lirc += `begin remote\n`
	lirc += `   name	Sensus-generated Lirc file  # https://pasthev.github.io/sensus/\n`
	lirc += `   bits	16\n`
	lirc += `   flags	SPACE_ENC|CONST_LENGTH\n`
	lirc += `   eps	30\n`
	lirc += `   aeps	100\n`
	lirc += `   header	${header}\n`
	lirc += `   one	${one}\n`
	lirc += `   zero	${zero}\n`
	lirc += `   ptrail	${ptrail}\n`
	lirc += `   pre_data_bits   16\n`
	lirc += `   pre_data	0x${pre}\n`
	lirc += `   gap	${gap}\n`
	lirc += `   toggle_bit_mask	0x0\n`
	lirc += `   frequency ${freq}\n`
	lirc += `\n`
	lirc += `   begin codes\n`
	lirc += `      KEY_MAIN	0x${lircCommand}\n`
	lirc += `	end codes\n`
	lirc += `end remote\n`

	copyToClipboard(lirc);
	write('Lirc file copied to clipboard, ready to be pasted into a new text file.')
	// return false;
}


function copyToClipboard(string) {         // _Copies %string to clipboard

	if (!string) {return};
	if (!navigator.clipboard) {
		message('Can not copy to clipboard');
		return
	}

	navigator.clipboard
	.writeText(string)
	.then( () => { info('Copied to clipboard: ' + string) } )
	.catch( () => { message('Failed to copy') } );
	
}
function ui_paste(fieldId) {               // Pastes clipboard to field with id string fieldId

	cleanOnClick();

	if (!navigator.clipboard) {
		message('Can not paste from clipboard');
		return
	}
	let string;
	navigator.clipboard
	.readText()
	.then( clipText => setField(fieldId, clipText));

	// return false;
}
function formatShort(str, space, plus) {   // Formats a string, adding space every %space, and + every %plus position i.e. 'a55a 9a65 + a55a 40bf'
	// let command = command.replace(/.{4}/g, '$& ');      // might exploit regEx, but boring with imbricated shifts

	if (!str) {return ''};
	let i, formated = '';
	str = str.replace(/[+]| /g, '');                       //  i.e. 'A559+A502' to 'a55a 9a65 + a55a 40bf'
	for (i in str) {
		if (i > 0) {
			if (plus && !(i % plus)) {                     // If i counter has reached a multiple of %plus
				formated += ' + ';
			} else if (space && !(i % space)) {            // If i counter has reached a multiple of %min
				formated += ' ';				
			}
		}
		formated += str.charAt(i);
	}
	return formated;
}

// Top toolbars functions

function ui_formToggle(formName) {      // Buttons to toggle panels on / off
	let form=document.getElementById(formName);
	if (form.hidden == true) {
		formShow(formName)
	} else {
		formHide(formName)
	}
}
function formHide(formName) {           // Hides given panel (called both from ui and internally)
	let form=document.getElementById(formName);
	form.hidden = true;
	let button=document.getElementById('b' + formName);                      // Buttons are named after corresponding panel (form) with a 'b' prefix
	let body = document.querySelector('body');
	let shadowColor = getComputedStyle(body).getPropertyValue('--col-s1');
	button.style.boxShadow = '-1px -1px 1px ' + shadowColor;                 // Inverts button's shadow for crappy 3D effect
	button.style.fontSize = '0.4em';                                         // Reduces font size in button to help crappy 3D effect
}
function formShow(formName) {           // Shows given panel (called both from ui and internally)
	let form=document.getElementById(formName);
	form.hidden = false;
	let button=document.getElementById('b' + formName);                     // Buttons are named after corresponding panel (form) with a 'b' prefix
	let body = document.querySelector('body');
	let shadowColor = getComputedStyle(body).getPropertyValue('--col-s1');
	button.style.boxShadow = '1px 1px 3px ' + shadowColor;                  // Restores button's shadow for crappy 3D effect
	button.style.fontSize = '0.6em';                                        // Restores font size in button to help crappy 3D effect
}
function ui_colorsToggle(theme) {       // Changes interface colors
	// ref: https://webdesign.tutsplus.com/tutorials/color-schemes-with-css-variables-and-javascript--cms-36989 
	// const setTheme = theme => document.documentElement.className = 'bnw';
	cleanOnClick();
	document.documentElement.className = theme;
	// return false;
}
function ui_fontSize(opt) {             // Changes text size in code fields
	cleanOnClick();
	let fontSize = window.getComputedStyle(document.getElementById("prontoField")).fontSize    // Just for info, gets size in px
	let fntSize = getComputedStyle(document.documentElement).getPropertyValue('--fntSize');    // Reads CSS variable
	let em = parseFloat(fntSize);
	if (opt) {em += .2} else {em -= .2};
	if ((em<5) && (em > .1)) {
		let newem = '' + em + 'em';
		document.documentElement.style.setProperty('--fntSize', newem);
		info('New font size: ' + fontSize + ' / ' + newem);
	} else {
		message('🙂 + 👓 = 😎 / 🙂 + 👓👓 = 🤓')
	}
	// return false;
}

// Message popup functions

function message(text){                 // Displays a ⚠ warning message at the bottom of the screen
	popup('⚠ ' + text, '--col-sb')
}
function info(text){                    // Displays an 🛈 info message at the bottom of the screen
	popup('🛈 ' + text, '--col-a1')
}
function popup(text, colCSSname){       // _Generates the popup window for message() and info() functions
// https://www.cssscript.com/alert-msg/
	closeMsg();
	let body = document.querySelector('body');
	let color = getComputedStyle(body).getPropertyValue(colCSSname);
	let textColor = getComputedStyle(body).getPropertyValue('--col-st');
	let div=document.createElement('div')

	let len = text.length;
	if (len > 79) {
		text = text.slice(0,79) + '…'
	}

	div.setAttribute('id', 'div_Msg');       // ID will be needed to close later through getElementById()

	div.style='font-family: Verdana, Tahoma, sans-serif';
	div.style.color = textColor;
	div.style.padding = '5';
	div.style.margin = '5';
	div.style.animation = 'messageAnim 0.3s linear';
	div.style.backgroundColor = color;
	div.style.position = 'fixed';
	div.style.bottom = '10';
	div.style.right = '50';
	div.style.left = '50';
	div.style.boxShadow = '5px 5px 10px ' + getComputedStyle(body).getPropertyValue('--col-s1');
	div.style.borderRadius = '8px';
	div.innerHTML = '&nbsp;<center><button onclick="closeMsg()" class="msg-text" style="cursor: pointer; background-color: transparent; border: 0px; outline: none; color: ' + textColor + '; position: absolute; top: 2; right: 2;">ⓧ</button><span>'+text+'</span></center>';
	document.body.appendChild(div);
}
function closeMsg(){
	let messagePopup=document.getElementById('div_Msg');
	if (messagePopup) {messagePopup.remove()};
}
function refreshAll(includeComm) {      // Triggers refreshes on all Frenquency and Repeat fields, and on IR/RF radio buttons
	
	freqReadPronto();
	freqReadDecimal();
	freqReadRaw();
	hexReadRepeats();
	b64ReadRepeats();	
	freqHexCheck();
	freqB64Check();
	if (includeComm) {             // includeCom flag is set to true when we want return from a conversion command to 
		let tmpOutput = output;    // also trigger a raw analysis attempt in order to generate the commands values,
		readRaw();                 // but in this case, we don't want to display the long output from raw analysis,
		output = tmpOutput;        // which would hide other possible warnings or logs. Hence saving and restoring
	}                              // initial log output, thus deleting the part that comes from raw analysis.

	if (output) {                  // Throws log, if any
		write(output);
		output = '';
		message('See Raw analysis panel for conversion logs')
	}
}
function write(text){                  // Sends text message to Raw Analysis field
	setField('testField', text);
}

/* Raw Panel functions ***************************************************************************************************************************



*/

// String Checks and repeats cleaning functions ---------------------------------------------------------------------------->	

function ui_clearAll() {
	cleanOnClick();
	clrField('cPreField');
	clrField('cHeaderField');
	clrField('cOneField');
	clrField('cZeroField');
	clrField('cPtrailField');
	clrField('cGapField');
	clrField('cFreqField');
	clrField('cShortField');
	clrField('cCommandField');
	setFocus('cShortField');
	clrField('prontoField');
	clrField('decimalField');
	clrField('rawField');
	clrField('broadlinkField');
	clrField('broadB64Field');
	clrField('testField');
	setFocus('rawField');
}
function ui_check() {                                       // 'Check' button in Raw Analysis panel : pulls figures out of figures
	cleanOnClick();
	let i, str = '', raw = getField('rawField');
	let hex, dec;
	let obj = stringType(raw);
    switch (obj.type) {                     //
        case 'binary':
			
			// 0011001100101101010011  abc123ab1bc123
			// 001100110010110101001100101100110100101010110010101010101100101100 (Hex command: 53a5 8409, no short)
			// 01000100000100010001000101000100000100010100000001000100000101010 (generates short a51a)
			// abc123ab23acb321abc111fbc123a (decimal: 171 193  35 171  35 172 179  33 171 193  17 251 193  35  10)


			output += 'Trying          ' + formatShort(obj.cleaned, 8, 0) + '\n';
			let binObj = searchBibits(obj.cleaned);
			if (!binObj.type) {info('nothing found'); break}

			str = obj.cleaned                                // Prepares a more readable 0011 [01100110 10010101 01100101 01010101 10010110] 00
			str = insertChars(str, ' [', binObj.shiftL);     // 
			str = insertChars(str, '] ', -binObj.shiftR);    // 
			i = binObj.shiftL + 10;                          // 2 chars for ' [' + 8 first bits
			while (i < str.length - 4 - binObj.shiftR) {     // 
				str = insertChars(str, ' ', i)               // 
				i += 9;                                      // 8 bits + 1 space
			}

			output += 'Bibits section: ' + str + '\n';
			output += 'Cleaned string length: ' + obj.cleaned.length + ' / ';
			output += 'Type detected: ' + binObj.type +' / ';
			output += 'Shift L: ' + binObj.shiftL +' / ';
			output += 'Shift R: ' + binObj.shiftR +' / ';
			output += 'Hex command: ' + formatShort(binObj.hex, 4, 8);
			if (binObj.short) {output += ' / Short: ' + binObj.short};
			
			hex = chunk(binObj.hex, 2)                                                  // '53a58409' => {'53', 'a5', '84', '09'}
			dec = hex.map(byte => parseInt(byte,16))                                    // {'53', 'a5', '84', '09'} => {83, 165, 132, 9}
			let lsb = dec.map(byte => toLsb(byte).toString(16).padStart(2, '0'));           // lsb: array of Less Significant bits first in hex format
			let inv = dec.map(byte => invert(byte).toString(16).padStart(2, '0'));          // inv: array of inverted decimals in hex format
			let inl = dec.map(byte => invert(toLsb(byte)).toString(16).padStart(2, '0'));   // inl: array of LSB & inverted decimals in hex format
			output += '\nBibits  : ' + formatShort(binObj.bin,8 ,0);
			output += '\nDecimal : ' + dec.join(' ');
			output += '\nHexa    : ' + hex.join(' ');
			output += '\nLSB     : ' + lsb.join(' ');
			output += '\ninvert  : ' + inv.join(' ');
			output += '\nLSB inv : ' + inl.join(' ');
			break;


		case 'decimal':
			dec = obj.cleaned.split(',')
			output += 'Cleaned string length: ' + obj.cleaned.length + ' / ';
			output += 'Type detected: decimal values. / ';
			output += 'Raw field contains ' + dec.length + ' values\n\n';
			output += 'Cleaned string: ' + dec.join(', ') + '\n';
			break;

		case 'hexa':
			hex = chunk(obj.cleaned, 2);
			dec = hex.map(byte => parseInt(byte, 16).toString().padStart(3, ' '));  // Translatess hex array to array of decimal strings with padding
			output += 'Type detected: hexadecimal values. / ';
			output += 'Cleaned string characters length: ' + obj.cleaned.length + ' / ';
			output += 'Number of values: ' + hex.length + ' / ';
			output += 'Cleaned string: ' + obj.cleaned + '\n';
			output += 'Hexa:     ' + hex.join('  ') + '\n';
			output += 'decimal: ' + dec.join(' ') + '\n';
			break;

		default:
			output += 'insert list of binary, decimal or hex values in the Raw panel, and try again';
    }
		output += '\nLongest repeat identified: ' + repeatFind(raw) + '\n';
		write(output);
}
function stringType(str) {                                           //  _Tells if str contains binary, decimal, or hex data - returns object
	
	if (!str.replace(/ /g, '')) {return 'empty string'};

	let cln = str.replace(/[L ;,.()\+\-]/g, '');            // test string after removing ' L;,()+-' chars

	if (/^[0-1]+$/.test(cln)) {                            // Case binary
		return {                    // Returns an object - Sample values:
			'type': 'binary',          // 'binary'
			'original': str,           // '00 11 0011; 00101  101010011'
			'cleaned': cln,            // '0011001100101101010011'
		};
	}


	if (/^\d+$/.test(cln)) {                               // Case hexadecimal (\d is exactly equivalent to [0-9] in js)
		cln = str.replace(/[L ;()\+]/g, '')
		return {                                // Returns an object - Sample values:
			'type': 'decimal',                  // 'decimal'
			'original': str,                    // '26L, 12, +15, (12-2)'
			'cleaned': cln,                     // '26,12,15,8' (had to make some choices here)
		};
	}

	if (/^[0-9A-Fa-f]+$/.test(cln)) {   // Case hexadecimal
		return {                        // Returns an object - Sample values:
			'type': 'hexa',             // 'hexa'
			'original': str,            // '2600, 1a 00,1d, 1d'
			'cleaned': cln,             // '26001a001d1d' (means hex strings will always be converted to single byte values here)
		};
	}


	return { 'type': 'invalid' };

	//str = str.replace(/[ ;\+\-]/g, ',');                      // Replaces spaces, ; + or - with commas if any
	//str = str.replace(/(\,){2,}/g, '$1');                     // Replaces multiple ",,," with single "," separator


}
function chunk(str, size) {                                          //  _Cuts a string in slices of %size length, returns an array of strings
    return str.match(new RegExp('.{1,' + size + '}', 'g'));
}
function insertChars(str, char, pos) {                               // _Inserts char at pos in str string
	if (str.length < pos) {return ''};
	return str.slice(0, pos) + char + str.slice(pos);
}
function ui_repeats() {                                              // Identifies longest duplicated sustrings and removes last occurrence of the dup 

	cleanOnClick();
	let raw = getField('rawField');
	let str = repeatFind(raw);
	let len = str.length;
	let separator = '';
	if (str) {

		switch (str.charAt()) {                 // Boring checks to try and preserve list of values separated by , or ; etc.
			case ',':                           // else '15, 12, 13, 4, 12, 13, 3' would become '15, 12, 13, 43',
				separator = ', '                // which would be correct, but probably not the desired effect
				break;                          //
			case ';', ' ', "/":                 //
				separator = 'str.charAt()'      //
				break;                          //
		}                                       //

		let i = raw.length;                          // Extracts last occurrence of the detected repeat
		while (i >= 0) {
			i--;
			if (raw.slice(i, i + len) == str) {
				let newRaw = raw.slice(0, i)
				newRaw += separator 
				newRaw += raw.slice(i + len);
				setField('rawField', newRaw)
				break;
			}
		}

		output += 'Longest repeat spotted: ' + str + '\n\n'
		output += 'Content in Raw panel has been purged from last occurrence. Original string was:\n' + raw;
	} else {
		output += 'No repeated string found.'
	}

	write(output);

}
function repeatFind(str) {                                           // In: string => Out: Last longest repeated substring

	// Inspired from https://stackoverflow.com/questions/65380016/the-longest-repeating-substrings-javascript
	
	let suffixes = [], len = str.length, i, string, pos1, pos2;

	for (i = 0; i < len; i++) {
		suffixes.push(str.slice(i, len));
	}
	suffixes.sort();
	
	let longestSubStr = '';
	for (i = 0; i < len - 1; i++) {
		string = commonSubstr(suffixes[i], suffixes[i + 1]);
		if (string.length >= longestSubStr.length) {
			//                                                            This test is here to avoid overlapping repeated substring
			pos1 = str.indexOf(string);                                // i.e. '123123123' would show repeat of '123' without this test
			pos2 = str.slice(pos1 + string.length).indexOf(string);    // searches new occurrence of string after first occurrence
			if (pos2 != -1) {longestSubStr = string};                  // (if needed, function could be modified with a 'acceptOverlap' yes/no flag)
		}
	}
	return longestSubStr;
}	
function commonSubstr(str1, str2) {                                  //  _Returns the longest common identical substring from the beginning of str1 & str2

	let shortest = Math.min(str1.length, str2.length);
	for (let i = 0; i < shortest; i++) {
		if (str1.charAt(i) != str2.charAt(i)) {
			return str1.slice(0, i);
		}
	}
	return str1.slice(0, shortest);
}

// Raw Analysis functions -------------------------------------------------------------------------------------------------->	

function ui_readRaw() {
	cleanOnClick();
	readRaw();
	setFocus('rawField');
	write(output); output = '';        // Because we won't call refreshAll(), as we don't want Raw Analysis to modify any other fields
	// return false;
}
function readRaw() {                                        // * Main Raw analysis function

	/* headerLength & trailerLength entered by user will be completely ignored in this function if their actual values can be identified in the process
	   at the end, these two values will only be considered in the case of a raw strings that contains no obvious headers or trailers
	   ie:      8548,4125,530,1220,530,530,530, [...] 1220,530,530,530,530,530,1220,530,25817    will force headerLength = 2 & trailerLength = 1
	   while:  530,1220,530,530,530,1220,530,530,530, [...] 1220,530,530,530,530,530,1220,530    will rely on user input, and show retained values afterward */

	let i, seqStart, sequence;
	let headerLength = parseInt(getField('headerLength'));
	let trailerLength = parseInt(getField('trailerLength'));           // 
	let raw = getField('rawField');
	if (raw.length < 8) {return false};                                // Assume smallest string accepted is one stripped byte
	let str = raw.split(',').map(Number);                              // String of comma-separated values ==> integer array
	str = stripRaw(str);                                               // Removes pronto header if any, to get bare raw
	let highest = findHighest(str);
	if (!highest) {return false};
	let zero = findZero(str, 0, highest);                             // Gets smallest identified zero 
	zero = averageZero(str, zero);                                    // Gets averaged zero 
	let one = findOne(str, zero, 2);                                  // Gets averaged one

	output += 'Values: ' + str.length + ' / ';
	output += ' Averaged zero: ' + zero;
	output += ' Averaged one: ' + one + ' / ';

	
	let header = findFullHeader(str, zero, one, headerLength);
	if (header.length) {
		firstHeaderPos = header.pop();                                // First header position had been pushed to header table by findFullHeader()
		headerLength = header.length;                                 // *** Replaces user-defined header length if a header has been identified***
		output += 'Header: ' + header.join(',');
		output += ' @pos. ' + firstHeaderPos + ' / ';
		seqStart = locateSequences(str, zero, one, firstHeaderPos, header);
	} else {
		seqStart = locateSequences(str, zero, one, 0, -1);
	}
	output += 'Sequences: ' + (seqStart.length - 1)
	output += ' - positions: ' + seqStart.toString() + ' / ';
	output += '\n\n';
	
	let gap = checkGap(str, highest);                                 // Gets gap string or '' (gap being the closing long value)

	if (gap) {trailerLength = 1} else {trailerLength = 0};            // *** Replaces user-defined trailer length if a trailer has been identified or not ***

	//let pTrail = checkPtrail(str, seqStart);                          // Gets pTrail string or '' ***** can hardly be sure of pTrail, so, first proposal here ***

	let seqQty = seqStart.length - 1;                                // Nombre de séquences
	let seq;
	let binCommand = [];
	let seqCommand = [];
	let lastType, lastBin, lastHex, lastShort;
	let lastShiftL = 0, lastShiftR = 0, lastCommand = '';

	// * Sequences loop ------------------------------------------------------------------------------------------------------------
	
	for (i = 0; i < seqQty; i ++) {                                  // Packets reading sequences (can't (for in) here)	
		//                                                              Function could be optimized by not re-running hexCommand() & searchBibits()
		//                                                              when binCommand == previous binCommand, but keep as is for readability

		seq = str.slice(seqStart[i] + headerLength,                      // i.e. seq = '75,549,549,275,275,549,549,275,275,549,275'
			seqStart[i+1] + 1 - trailerLength);		                     // +1 because slice excludes last, - trailerLength' as search parses groups of 8 from beginning)
		binCommand[i] = payloadRead(seq, zero, one);                     // i.e. binCommand = '011001100101101010011001011001...'
		seqCommand[i] = hexCommand(binCommand[i]);                       // i.e. seqCommand = '665a996695655596'

		output += "* Sequence " + i + ': ';                              // Start of sequence output
		output += "Binary length: " + binCommand[i].length + " / ";      // Outputs binary count
		output += "Rough command: ";                                     // Very rough:
		output += formatShort(seqCommand[i], 4, 8) + "\n";               //  stupidly printing bibits as if they were bits (but who knows?)
		output += seq + "\n";                                            // Outputs decimal slice 
		output += "Binary: *" + binCommand[i] + "*\n";                   // Outputs binary slice

		sequence = searchBibits(binCommand[i]);                          // Bibits search for this sequence; receives sequence object

		if (sequence.type != '') {                                            // Bibits! :)

			lastType = sequence.type;                                         // Function will assume the last sequence is the good one,
			lastShiftL = sequence.shiftL;                                     //  so let's store the last good values that have been read here
			lastShiftR = sequence.shiftR;                                     //  in case the last sequence that will be read would return an empty object
			lastBin = sequence.bin;                                           // 
			lastHex = sequence.hex;                                           // 
			lastShort = sequence.short;                                       // 
			lastCommand = seqCommand[i];                                      // Also stores identified rough hex commands[]
			lastPtrail = str.at(-1 - trailerLength);

			output += '> ' + lastType + ' encoding detected ';                // Outputs type (One-Hot or Nec)
			output += ' with shift value: '                                   // Outputs left & right shifts used,
			output += lastShiftL + '/' + lastShiftR ;                         //  in order to correct header / trailer Lengths
			output += ' *' + formatShort(lastBin, 8, 16) + '* ';              // Outputs decoded bibits binary values                  
			output += '- hex: *** ' + formatShort(lastHex, 0, 4) + ' *** ';   // Outputs the hex (Lirc) command, i.e. *** a55a + 58a7 ***
			output += '- short: <' + formatShort(lastShort, 0, 4) + '> ';     // Outputs the short command, i.e. <A51A>, or <>
			output += '\n';
		} else {
			output += 'No bi-bits encoding found. \n';                        // No bibits. :(
		}
		output += "\n";
	}
	
	// Now to recap or correct what has been found from sequences ------------------------------------------------------------------
	
	let flag = false;                                                      // if value is same for all sequences
	for (i in seqCommand) {                                                //  result will be i.e. 'ab2c'
		if (seqCommand[i].split('/')[0] != lastCommand.split('/')[0]) {    //     (splits chars after /, where exceeding values might have been shown)
			flag =true                                                     //  but if at least one differs, raises flag
		};
	}

	zero = zero.toString();                                          // So far, zero and one were used to store the "raw bit" values, or high & lows
	one = one.toString();                                            // but if bibits types have been identified, we'll need to properly assign these
	let zeroString, oneString;

	switch (lastType) {                                              //
		case 'One-Hot':                                              // One-Hot bibits (01b=zero / 10b=one)
			zeroString = zero + ', ' + one;                          //  i.e. zero = '275, 549'
			oneString = one + ', ' + zero;                           //        one = '549, 275'
			break;
		case 'Nec':                                                  // Nec bibits (00b=zero / 01b=one)
			zeroString = zero + ', ' + zero;                         //  i.e. zero = '275, 275'
			oneString = zero + ', ' + one;                           //        one = '275, 549'
			break;
		default:                                                     // No bibits but raw bits
			zeroString = zero;                                       //  i.e. zero = 275
			oneString = one;                                         //        one = 549
	}

	headerLength += lastShiftL;                                     // Corrects user-defined Header and Trailer Lengths,
	trailerLength += lastShiftR;                                    //  in case function would have shifted these values
	let pTrail = '';                                                // Defaults Ptrail to empty,
	if (lastShiftR == 1) {pTrail = lastPtrail};                     //  but validates last value if right shift == 1

	if (lastHex) {lastCommand = lastHex}              // If applicable, replaces raw hex with Nec or One-Hot real hex lastCommand


	// * Reports to log window -----------------------------------------------------------------------------------------------------

	let prefix = '';
	if (flag) {
		prefix += 'Multiple commands identified. ' + lastType + ' command from last sequence: ';
		prefix += '\n' + seqCommand.join('\n');
	} else {
		prefix += 'Unique ' + lastType + ' command identified: ';
	}
		prefix += '<' + formatShort(lastCommand, 4, 8) + '>';
	if (lastShort) {prefix += '. Short: *' + lastShort + '*'} else {prefix += ' (no short identified)'};
		prefix += '\nHeader: ' + header.join(', ') + ' / Ptrail: ' + pTrail
	if (lastShiftR > 1) {prefix += 'invalid (multiple values)'}
	if (lastShiftR < 1) {prefix += 'none'}

	prefix += ' / Gap: ' + gap

	prefix += ' / Full analysis below.';
	output = prefix + '\n\n' + output;

	// * Reports to Command panel --------------------------------------------------------------------------------------------------

	if (sequence.type != '') {                                            // Bibits! :)
		setField('cOneField', oneString);                                   // Injects Lirc values in Commands form
		setField('cZeroField', zeroString);
		setField('cCommandField', formatShort(lastCommand, 4, 8));
		setField('cShortField', formatShort(lastShort, 0, 4));
		setField('cGapField', gap); 
		setField('cHeaderField', header.join(', '));
		setField('headerLength', headerLength);
		setField('trailerLength', trailerLength);                           // 
		setField('cPtrailField', pTrail);
		document.getElementById('cPtrailField').placeholder = pTrail;
		setField('cPreField', '');
		document.getElementById('cPreField').placeholder = '';
	}
	// -----------------------------------------------------------------------------------------------------------------------------

}
function searchBibits(rawBin) {                                      // _Searches %rawBin string for One-Hot or Nec sequence, shifting start if not multiple of 8

/* For RC6, check http://www.pcbheaven.com/userpages/The_Philips_RC6_Protocol/index.php?topic=worklog&p=0

rawBin might be of any length above 15, since 16 bibits = 1 byte
i.e for 276,276,554,554,276,554,554,276,276,554,276,554,554,276,554,276,554,276,276,554,554,276
00110110 01011010 100110
rawBin length = 22 (len % 16=6), function will parse string like this:

i    
0:  [0011011001011010] 100110	> no bibit
1: 0 [0110110010110101] 00110	> no bibit
2: 00 [1101100101101010] 0110	> no bibit
3: 001 [1011001011010100] 110	> no bibit
4: 0011 [0110010110101001] 10	> One-Hot bibit: 4e
5: 00110 [1100101101010011] 0	> no bibit
6: 001101 [1001011010100110]	> Another One-Hot bibit: 9d (hence the need for user variable Header length)

*/
	let i, bin, result, hex, shift;
	let found = '', short = '';
	let len = rawBin.length;
	let toClip = len % 16;                          // Clip to byte; 16 bibits = 1 byte
	let debug = '';  			                    // Debug option in case of new encoding types study

	for (i=0; i <= toClip; i++) {
		bin = rawBin.slice(i, len - toClip + i);
		debug += '\n\n>>>>>> i=' + i + ' ' + bin.toString() + ' -> ';
		result = checkBinPairs(bin, 1, 2);            // Search for One-Hot bibits (01b=zero / 10b=one)
		if (result) {                                 // If result is not an empty string
			debug += 'One-Hot';
			found = 'One-Hot';                        //
			break;                                    // And exit for loop
		}
		
		result = checkBinPairs(bin, 0, 1);            // Search for Nec bibits (00b=zero / 01b=one)
		if (result) {                                 // If result is not an empty string
			found = 'Nec';                            //
			break;                                    // And exit for loop
		}
	}

	if (activeDebug) {output += activeDebug};

	if (found != '') {
		hex = parseInt(result, 2).toString(16);                    // i.e. hex = 53a58409
		if (hex.length % 2) {hex = '0' + hex};                     // padStart simply based on length parity
		shift = len -i - result.length * 2;                        // Calculates Right shift, while left shift is i

		if (found == 'Nec') {                                      // Only Nec type is worth searching for a search command,
			short = getShortFromCommand(hex, false);               // since only Nec needs 0/1s to be equilibrated
		}                                                          // short = '' if no short can be found

	} else {
		return { 'type': '' };                                     // Returns an object with only one empty element
	}

	return {                    // Returns an object - Sample values:
		'type': found,             // Nec
		'shiftL': i,               // 2
		'shiftR': shift,           // 1
		'bin': result,             // 10100101 01011010 + 01011000 10100111   (after formatShort(sequence.bin, 8, 16))
		'hex': hex,                // a55a + 58a7                             (after formatShort(sequence.hex, 0, 4))
		'short': short             // a51a                                    (might formatShort(sequence.short, 0, 4))
	};

}
function checkBinPairs(string, zero, one) {                          // __checks if binary %string contains bibits sequence and returns it as decoded bin string

	// Function can either be used to search for One-Hot pairs (01b=zero / 10b=one) - see https://fr.wikipedia.org/wiki/Encodage_one-hot
	// or for Nec pairs (00b=zero / 01b=one), in which case the whole sequence should later be found inverted to maintain constant signal duration

	let len = 2;                                                   // Making len a variable here, because function might be used to search tribits or more,
	let val, i;                                                    //  although only bibits seem to be interesting here, as they guarantee constant signal duration
	let debug ='';

	debug += 'String: ' + string + ' (string length=' + string.length + ') \n';

	if (string.length % len) {return ''}                           // length division error};
	let chunk = '';
	
	for (i = 0; i < string.length - len + 1 ; i += len) {          // Temporarily hard-coded for bibits only
		val = parseInt(string.substr(i, len),2);                   // Parses the string pair by pair,
		if (val == zero) {                                         // comparing bin pair value to decimal value received as argument
			chunk += '0';                                          // and feeding chunk string with resulting bit
		} else if (val == one) {
			chunk += '1';
		} else {                                                   // Invalid bibit encountered : assume end of sequence has been reached
			len = chunk.length;                                    // Recycles len variable to save the planet

			debug += ' chunk: ' + chunk + ' (chunk length=' + len + ') \n';

			if (len > 6) {                                         // if at least one byte has been decoded (first 16 bits)
				chunk = chunk.slice(0, Math.floor(len / 8) * 8);   //  stick to bytes only (looks like irScrutinizer coders wrongly used math.round here)
				return chunk;                                      //  and return the partial finding
			}
			return '';                                             // No significant bibits string found
		}
	}

	if (activeDebug) {output += activeDebug};

	return chunk;
}
function stripRaw(seq) {                                             // _Returns raw values stripped from Pronto header
	if (seq.length < 4) {return seq};                           // usual length of a Pronto header
	if (seq[0] == 0) {                                          // Pronto header always begin with a 0
		if ((seq[2] + seq[3]) * 2 == seq.length - 4) {          // Pronto header bytes 2 & 3 contain paquets A & B length
			output += '*Pronto header removed* /';
			return seq.slice(4);
		}
	}
	return seq;
}
function findHighest(seq) {                                          // _Identifies highest value in seq array
	let tmp;
	let highest = 0;
	for (let i in seq) {                                     // Identifies smallest value above min
		tmp = seq[i]
		if (tmp > highest) {highest = tmp};
	}
	return highest;
}
function findZero(seq, min, highest) {                               // _Identifies zero value above min and under highest in seq array
	
	let smallest = 0xffff;
	let i, tmp;
	for (i in seq) {                                            // Identifies smallest value above min
		tmp = seq[i]
		if ((tmp > min) && (tmp < smallest)) {smallest = tmp};
	}
	if (smallest == highest) {                                  // safeguard for recursive call
		output += "smallest = highest! " + highest + "\n";
		return 0
	}
	let count = 0;
	for (i in seq) {                                            // Counts occurences of ~smallest
		tmp = seq[i];
		if (Math.round(tmp / smallest) == 1) {count ++};
	}
	output += 'highest: ' + highest + ' / smallest: ';
	output += smallest + ' / Count: ' + count + ' / ';
	if (count < seq.length / 3) {                               // *** at least 1/3 of the values should be zeros
		smallest = findZero(seq, smallest, highest);            // recursive call
	}
	return smallest;	
}
function averageZero(seq, zero) {                                    // _Identifies zero value above min and under highest in seq array
	let tmp, count = 0, sum = 0;
	for (let i in seq) {                                        // Identifies all zeros
		tmp = seq[i]
		if (tmp >= zero) {                                      // since zero is min zero when called, excludes other small values
			if (is(tmp, zero)) {
				count ++;
				sum += tmp
			}
		}
	}
	output += 'Second pass zero count: ' + count + ' / ';
	return Math.round(sum / count);	
}
function findOne(seq, zero, factor) {                                // _Identifies one values as zero factors in seq array
	
	let i, tmp, count = 0, sum = 0;
	for (i in seq) {                                            // Identifies smallest value above min
		tmp = Math.round(seq[i] / zero)
		if (tmp >= factor && tmp <= factor + 1) {               // keep some margin; i.e. ones can be *2 or *3
			count ++;
			sum += seq[i];
		};
	}
	if (count){
		return Math.round(sum / count);
	} 
	output += 'Could not find any ones with factor ' + factor + ', '
	if (factor < MAX_FACTOR) {                                   // safeguard for recursive call
		output += 'increasing factor. ';
		factor ++
		return findOne(seq, zero, factor);                      // recursive call
	}
	return 0;	
}
function findFullHeader(seq, zero, one, headerLength) {              // _Identifies zero value above min and under highest in seq array

	let tmp;
	let firstHeaderPos = findFirstHeader(seq, zero, one, 0);
	let header = new Array()
	if (firstHeaderPos == -1) {return header};
	header[0] = seq[firstHeaderPos];
	for (let i = 1; i < headerLength; i ++) {               // Look for consecutive non-0s or 1s following first header value found
		tmp = seq[firstHeaderPos + i]
		if (!isZeroOrOne(tmp, zero, one)) {
			header[i] = tmp;                                // Found: stores candidate value and loops 
		} else {                                            // Not found : header values ending before defined header length)
			header.push(firstHeaderPos);                    // returned header[] array will contain values, and first header pos as last element
			return header;
		}
	}
	header.push(firstHeaderPos);                    // returned header[] array will contain values, + first header pos as last element
	return header;

}
function findFirstHeader(seq, zero, one, start) {                    // __Returns position of first non-zero/one value found after start in seq array
	let tmp, count = 0, sum = 0;
	for (i = start; i < seq.length -17; i ++) {                 // **** -17 because header found at the end would have no interest
		tmp = seq[i]
		if (!isZeroOrOne(tmp, zero, one)) {
			output += '1st header found at pos. '
			output += i + ' / ';
			return i;
		}
	}
	if (start == 0) {
		output += 'Could not find a first header. / ';
	}
	return -1;	
}
function locateSequences(dec, zero, one, firstHeaderPos, header) {   // _input raw decimals[], output array of pos[0,132,264] from header[]

	let index = 0;
	let seqStart = [];                                           // seqStart will store Seq milestones positions, e.g. [0,132,264]
	
	if (header != -1) {
		for (i = firstHeaderPos; i < dec.length - 1; i ++) {     // 
			tmp = dec[i]                                         // 
			if (is(tmp, header[0])) {                            // Search for approximate first header value
				let check = 1                                    // Resets check and mark first check
				if (i < dec.length - header.length) {            // In case end of string would contain a cropped header
					for (j = 1; j < header.length; j ++) {       // Check all header values against found values
						if (is(dec[i+j], header[j])) {           // Still only looking for approximations of header
							check ++
						}
					}
					if (check = header.length) {                 // If all headers check have passed
						seqStart[index] = i;
						index ++;
						i = i + header.length;
					}
				}
			}
		}			                                             // At this stage, seqStart = e.g. [0,132,264],
		seqStart[index] = i  			                         //  last element being the end marker
	} else {			                                         // If function was called without an identified header,
		seqStart[0] = firstHeaderPos;                            //  seqStart = e.g. {0, 264}
		seqStart[1] = dec.length - 1 ;                           // 
	}
	return seqStart;
}
function checkGap(str, highest) {                                    // _Returns it as string if last value in string is a possible Gap
	if (str[str.length-1] == highest) {              // If very last value of string is equal to highest value
		// for (i in str) {                            // (removed as too restrictive in case of RF)
		// if (str[i] >= highest) {return ''};         // If another value is as high as highest, then not a Gap, return ''
		// }                                           //
		return highest.toString();                   // Gap!
	}
	return '';                                       // no Gap.
}
function payloadRead(seq, zero, one) {                               // _input: array of values, output string of binary values

	let zeroCount = 0;
	let oneCount = 0;
	let value, i;
	let command = '';
	

	for (i = 0; i < seq.length; i ++) {                              // 
		value = seq[i];
		if (is(value, zero)) {
			command += '0';
			zeroCount ++;
		} else if (isClose(value, one)){
			command += '1';
			oneCount ++;
		} else {
			output += "\n Encountered out-of-range value: " + value + ' at step ' + i + ' in sequence:\n' + seq.join(', ') + '\n';
			break;;
		}
	}
	output += " / Zeros: " + zeroCount + " / Ones: " + oneCount + " - ";
	return command;
}
function hexCommand(binCommand) {                                    // _input: '101001101011001011000100...' output : 'a6b2c4...'
	let len = binCommand.length / 8;
	let hex = '';
	if (len >= 1) {
		for (let i = 0; i < len; i ++) {	
			hex += parseInt(binCommand.substring(i*8,i*8+8),2).toString(16);
		}
	}
	if (len != Math.round(len)) {                                      // if length is not a multiple of 8
		hex += " /" + binCommand.substring(Math.round(len)*8,len *8);  // returns exceeding bits as 'a6b2c4 /010110'
	}
	return hex;
}
function is(value, number) {                                         // __returns true if Math.round(value / number) == 1
	return Math.round(value / number) == 1;
}
function isClose(value, number) {                                    // __returns true if Math.round(value / number) == 1 or 2
	let tmp = Math.round(value / number)
	return (tmp == 1) || (tmp == 2);
}
function isZeroOrOne(value, zero, one) {                             // __returns true if number is a zero or close to a 1
	return is(value, zero) || isClose(value, one);
}
function ui_headTrailReset(head, trail) {                             // Resets Header and Trailer length values in Raw Analysis form
	setField('headerLength', head);
	setField('trailerLength', trail);                           // 
}
function checkPtrail(str, seqStart) {                                // * unused* Returns last value in string if a possible Ptrail, else false
	let tmp = seqStart.length, flag = true;
	if (tmp == 2) {return str[seqStart[1] - 1 ].toString()};
	
	let sample = str[seqStart[1]];
	for (let i = 2; i < seqStart.length; i ++) { 
		if (str[seqStart[i]] != sample) {flag = false};
	}
	if (flag) {return sample.toString()};
	return '';
}

// Acme functions --------------------------------------------------------------------------------------------------------->	

function buildRandom(hexLen, type) {               // Generates a random sequence from a %long length (random if %length = 0), with type = 'nec' or 'oneHot'
	//                                                Returns an object containing raw as well as commands
	let command, short = '', one, zero;
	
	if (!hexLen) {hexLen = getRandomInt(6)};
	switch (hexLen) {
		case 0:                                        // generates a 2-bytes hex short, i.e. 'a51a'
			short = getRandomHex(2);                   //
			command = getCommandFromShort(short);      // and pulls command from it, i.e. 'a55a 58a7'
			break
		case 5:                                        // generates a 4-bytes hex short, i.e. '2a5a + ef4f'
			short = getRandomHex(4);                   //
			command = getCommandFromShort(short);      // and pulls command from it, i.e. '54ab 5aa5 + f708 f20d'
			break
		default:                                       // generates a 1-4 bytes hex command with no short associated
			command = getRandomHex(hexLen);
	}
	output += `Random ${type} sequence: ${hexLen} - Short: ${short} - Command: ${command}\n`

	let bin = hexTobin(command);
	let v0 = 300 + getRandomInt(500);
	let v1 = Math.floor(v0 * (2 + Math.random()));
	if (type == ONEHOT) {
		one = v1.toString() + ' ' + v0.toString();           // Prepares One-Hot bibits (01b=zero / 10b=one)
		zero = v0.toString() + ' ' + v1.toString();
	} else {
		one = v0.toString() + ' ' + v1.toString();           // Prepares Nec bibits (00b=zero / 01b=one)
		zero = v0.toString() + ' ' + v0.toString();
	}
	let h1 = v0 * (5 + getRandomInt(5)) + Math.floor(v0 * (2 + Math.random()));
	let h2 = Math.floor(h1 * (.5 + Math.random() * 2));
	let header = `${h1}, ${h2}`
	let ptrail = 200 + getRandomInt(600);
	let gap = v0 * 80 + getRandomInt(10000);

	output += `Header: ${header} One: ${one} Zero: ${zero} Ptrail: ${ptrail} Gap: ${gap} Bin command: ${bin}\n`
	let raw = buildRaw(header,one,zero,ptrail.toString(),gap.toString(),bin);

	return {                        // Returns an object - Sample values:
		'raw': raw,                 // '8546, 4128, 526, 1604, 526, 552, 526, 1604, 526, 552, [...] 1604, 526, 1604, 526, 1604, 526, 25822'
		'command': command,
		'short': short,
		'header': header,           // '8548, 4125'
		'one': one,                 // '522 1615'
		'zero': zero,               // '522 547'
		'ptrail': ptrail,           // '522'
		'gap': gap,                 // '25817'
	};
}
function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}
function getRandomHex(count) {
	let hex = '';
	for (i = 0; i < count; i++) {
		hex += getRandomInt(256).toString(16).padStart(2, "0");
	}
	return hex;
}
function ui_acme(category) {            // Fills "Category" data with test values
	cleanOnClick();
	switch (category) {
		case 'Commands':
			acmeCommands(); break;
		case 'Pronto':
			acmePronto(); break;
		case 'Decimal':
			acmeDecimal(); break;
		case 'Raw':
			acmeRaw(); break;
		case 'Broadlink':
			acmeBroadlink(); break;
		case 'BroadB64':
			acmeBroadB64(); break;
		case 'Analysis':
			acmeAnalysis(); break;
	}
	// return false;
}
function acmeCommands() {               // Fills Commands data with test values
	
	/*setField('cShortField', 'A51A');
	setField('cCommandField', '');
	setField('cPreField', '');
	setField('cHeaderField', '8548, 4125');
	setField('cOneField', '522; 1615');
	setField('cZeroField', '522; 547');
	setField('cPtrailField', '522');
	setField('cGapField', '25817'); */

	let random = buildRandom(0, NEC);	              // length = random / type = 'Nec' (using constant)
	setField('cShortField', random.short);
	setField('cCommandField', random.command);
	setField('cPreField', '');
	setField('cHeaderField', random.header);
	setField('cOneField', random.one);
	setField('cZeroField', random.zero);
	setField('cPtrailField', random.ptrail);
	setField('cGapField', random.gap);
	let freq = parseInt(getField('cFreqField'));      // Frequency verification
	if (!checkFreqInput(freq, true)) {                // if Command Freq field is empty or user has typed a wrong value,
		setField('cFreqField', FREQ38);               //   defaults to 38 KHz
	}                                                 //
}
function acmePronto() {                 // Fills Pronto data with random value (actually a conversion from random raw)

	//setField('prontoField', '0000 006d 0022 0000 00ab 00a9 0016 003f 0016 003f 0016 003f 0016 0014 0016 0014 0016 0014 0016 0014 0016 0014 0016 003f 0016 003f 0016 003f 0016 0014 0016 0014 0016 0014 0016 0014 0016 0014 0016 0014 0016 003f 0016 0014 0016 0014 0016 0014 0016 0014 0016 0014 0016 0014 0016 003f 0016 0014 0016 003f 0016 003f 0016 003f 0016 003f 0016 003f 0016 003f 0016 06eb');
	// setField('prontoField', pronto);

	let raw = buildRandom(0, NEC).raw;	                       // length = random / type = 'Nec' (using constant)
	let pronto = getProntoFromRaw(raw, FREQ38);
	setField('prontoField', pronto);
	write(output); output = '';
	freqReadPronto();
	setFocus('prontoField');
}
function acmeDecimal() {                // Fills Decimal data with random value (actually a conversion from random raw)

	//setField('decimalField', '0L, 109L, 34L, 0L, 171L, 169L, 22L, 63L, 22L, 63L, 22L, 63L, 22L, 20L, 22L, 20L, 22L, 20L, 22L, 20L, 22L, 20L, 22L, 63L, 22L, 63L, 22L, 63L, 22L, 20L, 22L, 20L, 22L, 20L, 22L, 20L, 22L, 20L, 22L, 20L, 22L, 63L, 22L, 20L, 22L, 20L, 22L, 20L, 22L, 20L, 22L, 20L, 22L, 20L, 22L, 63L, 22L, 20L, 22L, 63L, 22L, 63L, 22L, 63L, 22L, 63L, 22L, 63L, 22L, 63L, 22L, 1771L');

	let raw = buildRandom(0, NEC).raw;	                       // length = random / type = 'Nec' (using constant)
	let dec = getDecimalFromRaw(raw, FREQ38);
	setField('decimalField', dec.join("L, ") + "L");
	write(output); output = '';
	freqReadDecimal();
	setFocus('decimalField');
}
function acmeRaw() {                    // Fills Raw data with test value

	// setField('rawField', '0, 115, 0, 12, 888, 888, 888, 888, 1776, 888, 888, 888, 888, 888, 888, 888, 888, 888, 888, 1776, 1776, 888, 888, 888, 888, 888, 888, 90943');

	let raw = buildRandom(0, NEC).raw;	                       // length = random / type = 'Nec' (using constant)
	setField('rawField', raw);		                       // Publish Raw without headers
	setField('freqFieldRaw', FREQ38)
	freqSetRaw();
	write(output); output = '';
	setFocus('rawField');
}
function acmeBroadlink() {              // Fills Broadlink data with test value

	// setField('broadlinkField', '26001a001d1d1d1d3a1d1d1d1d1d1d1d1d1d1d3a3a1d1d1d1d1d1d000baa0d05000000000000000000000000');

	let sigType = setBrHexFreq('', '')
	let repeats = parseInt(getField('hexRepeats'));
	let broadlinkHex = acmeBroadGen(sigType, repeats);

	setField('broadlinkField', broadlinkHex);

	write(output); output = '';
	freqHexCheck();
	hexReadRepeats();
	setFocus('broadlinkField');
}
function acmeBroadB64() {               // Fills Broadlink B64 data with test value
	// setField('broadB64Field', 'sgUyAAYUBxMHFBMHBxQTBwYUBxMHFBMHBxQTBwYUEwcGFBMHEwcTBwYUBxQSBxMHBhMHEwa/AAA=');

	let sigType = setBrHexFreq('', 'b64')
	let repeats = parseInt(getField('b64Repeats'));
	let broadlinkHex = acmeBroadGen(sigType, repeats);

	setField('broadB64Field', hexToBase64(broadlinkHex));
	write(output); output = '';
	freqB64Check();
	b64ReadRepeats();	
	setFocus('broadB64Field');
}
function acmeBroadGen(sigType, repeats) {              // _Generates random Broadlink hex code

	let raw = buildRandom(2, ONEHOT).raw;	                           // length = random / type = 'Nec' (using constant)
	let freq = FREQ38;                                             // arbitrary, as we don't really care here since Broadlink won't store freq value
	let pronto = getProntoFromRaw(raw, freq);
	let broadlinkHex = getBroadlink(pronto, sigType).join('');
	if (checkRepeatsInput(repeats)) {
		broadlinkHex = setHexRepeats(broadlinkHex, repeats);
	}

	return broadlinkHex;
}
function acmeAnalysis() {               // Fills Analysis data with test values
	setField('headerLength', '3');
	setField('trailerLength', '1');
	// setField('testField', '10020, 6761, 275, 305, 670, 670, 275, 275, 701, 305, 670, 305, 670, 305, 670, 275, 701, 275, 701, 305, 670, 640, 305, 275, 701, 275, 670, 305, 670, 305, 701, 275, 670, 305, 701, 640, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 670, 275, 305, 670, 640, 305, 305, 670, 305, 670, 305, 670, 275, 701, 640, 305, 275, 10020, 6761, 275, 305,');
	// setField('rawField', '305, 670, 305, 701, 275, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 670, 275, 275, 701, 640, 305, 275, 701, 275, 670, 305, 701, 275, 670, 670, 275, 305, 10020, 6761, 275, 305, 670, 670, 275, 275, 701, 305, 670, 305, 670, 305, 670, 275, 701, 275, 701, 305, 670, 640, 305, 275, 701, 275, 670, 305, 670, 305, 701, 275, 670, 305, 701, 640, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 670, 275, 305, 670, 640, 305, 305, 670, 305, 670, 305, 670, 275, 701, 640, 305, 275, 10020, 6761, 275, 305, 670, 670, 275, 305, 701, 275, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 275, 701, 275, 701, 305, 670, 275, 701, 275, 701, 275, 670, 670, 305, 640, 305, 275, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 9989, 6761, 305, 305, 670, 640, 305, 275, 701, 275, 701, 275, 701, 275, 701, 275, 701, 275, 701, 275, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 640, 305, 275, 701, 640, 275, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 45681');
	//setField('rawField', '305, 670, 305, 701, 275, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 670, 275, 275, 701, 640, 305, 275, 701, 275, 670, 305, 701, 275, 670, 670, 275, 305, 10020, 6761, 275, 305, 670, 670, 275, 275, 701, 305, 670, 305, 670, 305, 670, 275, 701, 275, 701, 305, 670, 640, 305, 275, 701, 275, 670, 305, 670, 305, 701, 275, 670, 305, 701, 640, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 670, 275, 305, 670, 640, 305, 305, 670, 305, 670, 305, 670, 275, 701, 640, 305, 275, 10020, 6761, 275, 305, 670, 670, 275, 305, 701, 275, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 275, 701, 275, 701, 305, 670, 275, 701, 275, 701, 275, 670, 670, 305, 640, 305, 275, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 9989, 6761, 305, 305, 670, 640, 305, 275, 701, 275, 701, 275, 701, 275, 701, 275, 701, 275, 701, 275, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 640, 305, 275, 701, 640, 275, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 10020, 6761, 275, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 275, 701, 305, 670, 305, 670, 305, 670, 275, 701, 275, 701, 640, 305, 275, 701, 275, 701, 275, 701, 275, 701, 275, 670, 305, 670, 670, 275, 670, 275, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 640, 305, 275, 10020, 6761, 305, 275, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 275, 701, 275, 701, 275, 701, 640, 305, 640, 305, 275, 701, 640, 275, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 10020, 6731, 305, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 275, 701, 275, 701, 305, 670, 640, 275, 305, 701, 275, 670, 305, 701, 275, 670, 305, 670, 305, 701, 640, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 670, 275, 305, 670, 670, 275, 275, 701, 275, 701, 275, 701, 305, 670, 640, 305, 275, 10020, 6761, 275, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 275, 701, 275, 701, 275, 701, 305, 670, 275, 701, 275, 670, 670, 305, 640, 275, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 9989, 6761, 305, 275, 701, 640, 275, 305, 701, 275, 701, 275, 701, 275, 701, 275, 701, 275, 701, 275, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 640, 305, 275, 701, 670, 244, 305, 701, 275, 701, 275, 670, 305, 701, 640, 275, 305, 10020, 6761, 275, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 275, 701, 275, 701, 640, 305, 275, 701, 275, 701, 275, 701, 275, 701, 275, 701, 275, 701, 640, 275, 670, 275, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 9989, 6761, 305, 275, 701, 640, 305, 275, 701, 305, 670, 275, 701, 275, 701, 275, 670, 305, 701, 275, 701, 640, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 275, 701, 640, 305, 640, 305, 275, 701, 640, 275, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 10020, 6761, 275, 305, 670, 670, 275, 275, 701, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 275, 701, 305, 670, 305, 670, 275, 701, 275, 701, 305, 670, 640, 305, 275, 701, 275, 701, 275, 701, 275, 701, 275, 670, 305, 701, 640, 275, 670, 275, 305, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 305, 9989, 6792, 275, 275, 701, 640, 305, 275, 701, 305, 670, 305, 670, 275, 701, 275, 701, 275, 701, 275, 701, 640, 305, 275, 701, 275, 701, 275, 701, 275, 701, 275, 701, 275, 670, 670, 275, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 305, 670, 670, 275, 670, 275, 305, 670, 670, 275, 275, 701, 275, 701, 275, 701, 275, 701, 640, 305, 275, 10020, 6761, 275, 305, 670, 670, 275, 305, 701, 275, 701, 275, 701, 122, 45681');
	setField('rawField', '9289, 6853, 275, 275, 549, 549, 275, 275, 549, 549, 275, 275, 549, 275, 518, 579, 244, 579, 244, 549, 275, 275, 549, 549, 275, 275, 549, 275, 549, 549, 275, 275, 549, 549, 275, 549, 275, 275, 549, 275, 549, 275, 518, 305, 549, 823, 275, 275, 518, 305, 518, 305, 518, 305, 518, 275, 549, 275, 549, 549, 275, 275, 549, 275, 549, 549, 275, 275, 9289, 6853, 275, 275, 518, 579, 275, 275, 549, 549, 244, 305, 518, 305, 518, 579, 244, 579, 244, 579, 244, 305, 518, 579, 244, 305, 518, 275, 549, 549, 275, 275, 549, 549, 275, 549, 275, 275, 549, 275, 549, 275, 549, 275, 549, 823, 244, 305, 518, 305, 518, 305, 518, 305, 518, 305, 518, 305, 518, 549, 275, 275, 549, 275, 549, 549, 275, 275, 9289, 6853, 275, 275, 549, 549, 275, 275, 518, 579, 275, 275, 518, 305, 518, 579, 244, 579, 244, 579, 244, 305, 518, 579, 244, 275, 549, 275, 549, 579, 244, 275, 549, 549, 275, 549, 275, 275, 549, 275, 549, 275, 549, 275, 549, 823, 275, 275, 549, 275, 518, 305, 549, 275, 518, 305, 549, 275, 518, 579, 244, 305, 518, 305, 518, 579, 244, 275, 9289, 6883, 244, 275, 549, 549, 275, 275, 549, 549, 275, 305, 518, 275, 549, 549, 275, 549, 275, 549, 275, 275, 549, 549, 275, 275, 549, 275, 518, 579, 275, 275, 549, 549, 244, 579, 244, 305, 518, 275, 549, 305, 518, 305, 518, 823, 275, 275, 549, 275, 549, 275, 549, 275, 549, 275, 549, 275, 549, 549, 244, 305, 518, 305, 518, 579, 244, 305, 9258, 6853, 275, 275, 549, 549, 275, 275, 549, 549, 275, 305, 518, 275, 549, 549, 275, 549, 275, 549, 275, 275, 549, 549, 244, 305, 549, 275, 518, 579, 244, 305, 518, 579, 244, 549, 275, 305, 518, 275, 549, 305, 518, 275, 549, 823, 275, 275, 549, 275, 549, 275, 549, 275, 549, 275, 549, 275, 549, 549, 275, 275, 549, 275, 518, 579, 244, 305, 9289, 6853, 244, 275, 549, 549, 275, 275, 549, 549, 275, 275, 549, 275, 518, 579, 275, 549, 244, 579, 275, 275, 518, 579, 244, 305, 518, 305, 518, 579, 244, 305, 518, 549, 275, 549, 275, 275, 549, 275, 549, 275, 549, 275, 549, 823, 244, 305, 549, 275, 549, 275, 518, 305, 518, 305, 549, 244, 549, 579, 244, 305, 518, 275, 549, 579, 244, 275, 9289, 6853, 275, 275, 549, 549, 275, 275, 549, 549, 275, 275, 549, 275, 549, 549, 244, 549, 275, 579, 244, 275, 549, 549, 275, 275, 549, 275, 549, 549, 275, 275, 549, 549, 275, 549, 275, 275, 549, 275, 549, 275, 518, 305, 549, 823, 244, 305, 549, 275, 518, 305, 518, 275, 549, 275, 549, 275, 549, 549, 275, 275, 549, 275, 549, 549, 275, 275, 9289, 6853, 275, 275, 518, 579, 244, 305, 518, 549, 275, 275, 549, 275, 549, 549, 275, 549, 275, 549, 275, 275, 549, 549, 275, 275, 549, 275, 549, 549, 275, 275, 549, 549, 244, 579, 244, 305, 518, 305, 518, 305, 518, 305, 518, 853, 244, 275, 549, 275, 549, 275, 549, 275, 549, 275, 549, 275, 549, 549, 244, 305, 518, 305, 549, 549, 244, 305, 9289, 6822, 275, 275, 549, 549, 275, 275, 549, 549, 275, 275, 549, 275, 549, 549, 275, 549, 244, 579, 244, 305, 518, 579, 244, 305, 518, 305, 518, 549, 275, 275, 549, 549, 275, 549, 275, 275, 549, 275, 549, 275, 549, 275, 549, 823, 275, 275, 549, 275, 518, 305, 518, 305, 518, 305, 518, 275, 549, 549, 275, 275, 549, 305, 518, 549, 275, 275, 9289, 6853, 244, 305, 549, 549, 244, 275, 549, 579, 244, 305, 518, 305, 518, 549, 275, 549, 275, 549, 275, 275, 549, 549, 275, 275, 549, 275, 549, 549, 275, 275, 549, 549, 244, 579, 244, 305, 518, 305, 518, 305, 518, 305, 518, 853, 244, 275, 549, 275, 549, 275, 549, 275, 549, 275, 549, 275, 549, 549, 244, 305, 518, 305, 549, 549, 244, 305, 9289');
	setFocus('rawField');
}

// Frequency functions --------------------------------------------------------------------------------------------------->	

function ui_freq(button) {                      // Frequency buttons in Commands Panel
    switch (button) {                     //
        case 36:
			setField('cFreqField', FREQ36);
            break;
		case 38:
			setField('cFreqField', FREQ38);
			break;
        default:
			setField('cFreqField', FREQ40);
    }
}
function checkFreqInput(freq, warn) {
	if (freq > 63 && freq < 4145146) { return true };
	if (warn) {message("Frequency must be between 63 Hz and 4145146 Hz")};
	return false;
}
function freqtoHz(dec) {                        // Returns Hertz value from encoded frequency
  let frequency = 1 / (dec * 0.241246);       // freq = actual frequency / 1000000
  return Math.round(frequency * 1000000);
}
function freqFromHz(dec) {                      // Returns encoded frequency from Hertz
	dec = dec / 1000000
	return Math.round(1 / 0.241246 / dec);
}
function freqFromDecimal(str, newFreq, raw) {   // Returns modified dec. str with newFreq; if newFreq=0, returns current freq or 0 if non valid
												// raw is a flag: if true, won't throw an alert for missing header
	// Partly dupped with freqFromPronto, could be optimized
	
	str = str.replace(/[L \+\-]/g, '');
	let dec = str.trim().split(',').map(byte => parseInt(byte));  // Converts decimal string to array of decimal values
	
	if (dec[0] == 0) {
		if ((dec[2] + dec[3]) * 2 == dec.length - 4) {
			if (newFreq) {
				dec[1] = freqFromHz(newFreq);
				return dec.join("L, ")+"L"
			}
			return freqtoHz(dec[1]);
		}
	}
	
	if (raw) {                                                 // if working on raw, it's acceptable to have no header
		//
	} else {                                                   // if not working on raw, throw error as header is missing
		output += 'Raw IR String seems wrong: ' + str + '\n';
	}return 0;
}
function freqFromPronto(str, newFreq) {         // Returns modified hex. str with newFreq; if newFreq=0, returns current freq or 0 if non valid

	// Partly dupped with freqFromDecimal, could be optimized
	
	str = str.replace(/ /g, ',');
	let dec = str.trim().split(',').map(value => parseInt(value,16));  // Converts hex string to array of decimal values
	
	if (dec[0] == 0) {
		if ((dec[2] + dec[3]) * 2 == dec.length - 4) {
			if (newFreq) {
				dec[1] = freqFromHz(newFreq);
				return decToHex(dec.join(','));
			}
			return freqtoHz(dec[1]);
		}
	}
	output += 'Pronto IR String seems wrong \n';
	return 0;
}
function ui_freqRead(field) {                   // Updates given Frequency field
	cleanOnClick();
	switch (field) {
		case 'Pronto':
			freqReadPronto();
			setFocus('freqFieldPronto');
			break;
		case 'Decimal':
			freqReadDecimal();
			setFocus('freqFieldDecimal');
			break;
		case 'Raw':
			freqReadRaw();
			setFocus('freqFieldRaw');
			break;
	}
	// return false;
}
function ui_freqSet(field) {                    // Updates Pronto Frequency field
	cleanOnClick();
	switch (field) {
		case 'Pronto':
			freqSetPronto();
			setFocus('freqFieldPronto');
			break;
		case 'Decimal':
			freqSetDecimal();
			setFocus('freqFieldDecimal');
			break;
		case 'Raw':
			freqSetRaw();
			setFocus('freqFieldRaw');
			break;
	}
	// return false;
}
function freqReadPronto() {                     // Updates Pronto Frequency field
	let pronto = getField('prontoField');
	setField('freqFieldPronto', freqFromPronto(pronto, 0));
}
function freqSetPronto() {                      // Changes Pronto Frequency
	let newFreq = getField('freqFieldPronto');
	let newDec = freqFromPronto(getField('prontoField'), newFreq);
	
	if (newDec && checkFreqInput(newFreq, true)) {
		setField('prontoField', newDec);
	}
}
function freqReadDecimal() {                    // Updates Decimal Frequency field
	let dec = getField('decimalField');
	setField('freqFieldDecimal', freqFromDecimal(dec, 0, false));
}
function freqSetDecimal() {                     // Changes Decimal Frequency
	let dec = getField('decimalField');
	let newFreq = getField('freqFieldDecimal');
	let newDec = freqFromDecimal(dec, newFreq, false);

	if (newDec && checkFreqInput(newFreq, true)) {
		setField('decimalField', newDec);
	}
}
function freqReadRaw() {                        // Updates Raw Frequency field
	let raw = getField('rawField');
	setField('freqFieldRaw', freqFromDecimal(raw, 0, true));
}
function freqSetRaw() {                         // Changes Raw Frequency
	//
	// Rather than direct convert, let's go through conversion to Pronto then back to Raw here (reason is, raw
	//  doesn't necessarily include packet length and Freq info, and getProntoFromRaw() already takes care of that)
	//
	let raw = getField('rawField');
	let newFreq = getField('freqFieldRaw');
	if (checkFreqInput(newFreq, true)) {
		let pronto = getProntoFromRaw(raw, newFreq)
		setField('rawField', getRawFromPronto(pronto).join(", "));					// 
	}
}
function ui_freqHexCheck() {                    // Check IR or RF value in Broadlink Hex button
	cleanOnClick();
	freqHexCheck();
	// return false;
}
function freqHexCheck() {                       // Returns IR or RF value from Broadlink hex field and checks applicable radio button
	let hex = getField('broadlinkField');
	let freq = getFreqFromBrHex(hex)
	if (!updateRadioType(freq, '')) {           // forces update of Radio buttons state and acts if error returned
		output += 'Signal type from Broadlink Hex seems invalid\n';
	};
	return freq;
}
function ui_freqB64Check() {                    // Check IR or RF value in Broadlink B64 button
	cleanOnClick();
	freqB64Check();
	// return false;
}
function freqB64Check() {                       // Returns IR or RF value from Broadlink B64 string and checks applicable radio button
	let b64 = getField('broadB64Field');
	let freq = getFreqFromBrHex(base64ToHex(b64))
	if (!updateRadioType(freq, 'b64')) {    // forces update of Radio buttons state and acts if error returned
		output += 'Signal type from Broadlink B64 seems invalid\n'
	}
	return freq;
}
function getFreqFromBrHex(hex) {                // _Reads signal type in Broadlink hex string, returns decimal 38/178/215 for IR/RF433/RF315 
	let freq = parseInt(hex.substring(0,2),16)
	if (!freq) {freq = 0};
	return freq;
}
function updateRadioType(freq, fieldSuffix) {   // _Updates radio buttons statuses for both broadlink hex or b64
	//                                               (exploits the naming convention, appending 'b64' suffix to fieldnames if B64 call)
	switch (freq) {
		case 38: document.getElementById('rbIR0' + fieldSuffix).checked = true; break;      // 0x26 : IR
		case 178: document.getElementById('rbRF4' + fieldSuffix).checked = true; break;     // 0xb2 : RF 433Mhz
		case 215: document.getElementById('rbRF3' + fieldSuffix).checked = true; break;     // 0xd7 : RF 315Mhz
		default: return false;
	}
	return true;
}
function ui_freqHexSet() {                      // Apply IR or RF value in Broadlink Hex button
	cleanOnClick();
	freqHexSet();
	// return false;
}
function freqHexSet() {                         // Changes Broadlink Hex string header to apply radio button choice (IR, RF433...)
	let hex = getField('broadlinkField');
	setField('broadlinkField', setBrHexFreq(hex, ''));
}
function ui_freqB64Set() {                      // Apply IR or RF value in Broadlink B64 button
	cleanOnClick();
	freqB64Set()
	// return false;
}
function freqB64Set() {                         // Changes Broadlink B64 string header to apply radio button choice (IR, RF433...)
	let hex = base64ToHex(getField('broadB64Field'));
	setField('broadB64Field', hexToBase64(setBrHexFreq(hex, 'b64'))); 
}
function setBrHexFreq(hex, fieldSuffix) {       // checks 'rbIR0' or 'rbIR0b64' radio buttons, returns %string modified with 26/b2/d7 prefix
	//                                               (changes signal type in Broadlink Hex to IR/RF/RF according to designated suffix radio buttons)
	//                                               (exploits the naming convention, appending 'b64' suffix to fieldnames if B64 call)
	let freq = '26';                                                  // no need to check 'rbIR' .checked here
	if (document.getElementById('rbRF4' + fieldSuffix).checked) {freq = 'b2'};
	if (document.getElementById('rbRF3' + fieldSuffix).checked) {freq = 'd7'};

	return freq + hex.slice(2);                             // slice() doesn't return an error when a string is empty
}
// Broadlink Repeat functions --------------------------------------------------------------------------------------------------->	

function ui_hexReadRepeats() {                        // Read repeats from Broadlink Hex button
	cleanOnClick();
	hexReadRepeats();
	// return false;
}
function hexReadRepeats() {                           // ** Main- Refreshes number of repeats in Broadlink Hex field
	let hex = getField('broadlinkField')
	setField('hexRepeats', getHexRepeats(hex));
}
function ui_b64ReadRepeats() {                       // Read repeats from Broadlink B64 button
	cleanOnClick();
	b64ReadRepeats();
	// return false;
}
function b64ReadRepeats() {                          // ** Main- Refreshes number of repeats in Broadlink B64 field
	let hex = base64ToHex(getField('broadB64Field'));
	setField('b64Repeats', getHexRepeats(hex));
}
function ui_hexSetRepeats() {                        // ** Main- Change Broadlink Hex repeats button
	cleanOnClick();

	let hex = getField('broadlinkField');
	let repeats = parseInt(getField('hexRepeats'));
	
	if (checkRepeatsInput(repeats)) {
		setField('broadlinkField', setHexRepeats(hex,repeats));
	}
	setFocus('hexRepeats');

	// return false;
}
function ui_b64SetRepeats() {                        // ** Main- Change Broadlink B64 repeats button
	cleanOnClick();

	let b64 = getField('broadB64Field');
	let repeats = parseInt(getField('b64Repeats'));
	
	if (checkRepeatsInput(repeats)) {
		let newHex = setHexRepeats(base64ToHex(b64),repeats);
		setField('broadB64Field', hexToBase64(newHex));
	}
	setFocus('b64Repeats');

	// return false;
}
function getHexRepeats(hex) {                               // _Returns number of repeats from a Hex sequence
	hex = hex.replace(/ /g, '');                  // Removes spaces if any
	let repeats = hex.substring(2,4);             // Reads second pair of chars as text - Changed from js - was: hex.subst(2,2)
	let decimal = parseInt(repeats,16);           // Converts Hex text string to decimal value 
	return decimal;                               //
}
function setHexRepeats(hex,vrepeats) {                      // _Sets number of repeats in a Hex sequence
	hex = hex.replace(/ /g, '');      // Removes spaces if any
	let lstring = hex.substring(0,2);
	let rstring = hex.slice(4);
	let repeats = vrepeats.toString(16).padStart(2, '0');
	return lstring + repeats + rstring;
}
function checkRepeatsInput(repeats) {                       // _sanity check on repeats value, returns true if OK
	if (repeats >= 0 && repeats < 256) { return true };
	message("Repeats value must be between 0 and 255");
	return false;
}

// Conversion buttons main functions ------------------------------------------------------------------------------------------->	

function ui_shortToCommand() {                        // Short ==> Command small button
	cleanOnClick();
	shortToCommand();
	// return false;
}
function shortToCommand() {                           // ** Main- Short ==> Command function call **************************

	let short = stripHex(getField('cShortField'),4);            // Removes spaces and + signs ; min length set to 4
	setField('cShortField' , formatShort(short, 0, 4));         // Republishes the correct string in field (even if empty)
	if (short == '') {return}
	let hex = getCommandFromShort(short)
	output += hex;
	setField('cCommandField', hex);

}
function ui_commandToShort() {                       // Command ==> Short  small button
	cleanOnClick();
	commandToShort();
	// return false;
}
function commandToShort() {                           // ** Main- Command ==> Short function call **************************

	let command = getField('cCommandField');
	setField('cShortField', getShortFromCommand(command, true));

}
function ui_convertCodes() {                          // Convert from Codes button
	cleanOnClick();
	convertCodes();
	refreshAll(false);
	setFocus('cCommandField');                              // To make it clear that priority has been given to Lirc field over Command field
	// return false;
}
function convertCodes() {                             // ** Main- Converts all fields from Codes values **********************

	let header = getField('cHeaderField');
	let one = getField('cOneField');
	let zero = getField('cZeroField');
	let ptrail = getField('cPtrailField');
	let gap = getField('cGapField');

	let freq = getField('cFreqField');
	
	let lircCommand = getField('cCommandField');
	if (lircCommand == "") {
		shortToCommand();
		lircCommand = getField('cCommandField');
	}
	if (one && zero && lircCommand) {
		let bin = hexTobin(lircCommand);		
		let raw = buildRaw(header,one,zero,ptrail,gap,bin);
		setField('rawField', raw);		                           // Publish Raw without headers
		if (freq) {
			setField('freqFieldRaw', freq);                        // Temporarily fills Raw frequency field
			convertRaw(getField('rawField'));
		}
		setField('freqFieldRaw', '00000');                         // Resets Raw frequency field since Raw field contains raw only
		
	}
}
function ui_convertPronto() {                         // Convert from Pronto button
	cleanOnClick();
	convertPronto(getField('prontoField'));
	refreshAll(true);
	setFocus('prontoField');
	// return false;
}
function convertPronto(pronto) {                      // ** Main- Converts all fields from Pronto string value ***************

	setField('decimalField', hexToDec(pronto).join("L, ")+"L");
	setField('rawField', getRawFromPronto(pronto).join(", "));
	let broadlinkHex = getBroadlink(pronto, "26").join("");
	setField('broadlinkField', broadlinkHex);
	setField('broadB64Field', hexToBase64(broadlinkHex));

}
function ui_convertDecimal() {                        // Convert from decimal button
	cleanOnClick();
	convertDecimal(getField('decimalField'));
	refreshAll(true);
	setFocus('decimalField');
	// return false;
}
function convertDecimal(decimal) {                    // ** Main- Converts all fields from decimal string value **************

	let pronto = decToHex(decimal);
	setField('prontoField', pronto);
	setField('rawField', getRawFromPronto(pronto).join(", "));
	let broadlinkHex = getBroadlink(pronto, "26").join("");
	setField('broadlinkField', broadlinkHex);
	setField('broadB64Field', hexToBase64(broadlinkHex));

}
function ui_convertRaw() {                            // Convert from Raw button
	cleanOnClick();
	convertRaw(getField('rawField'));
	setFocus('rawField');
	refreshAll(true);
	// return false;
}
function convertRaw(raw) {                            // ** Main- Converts all fields from Raw string value *****************

	let freq = freqFromDecimal(raw, 0, true)          // Checks if raw contains hard-coded frequency value (if not, 'freqFieldRaw' gets reset)
	if (!checkFreqInput(freq, false)) {
		freq = getField('freqFieldRaw');
		if (!checkFreqInput(freq, false)) {freq = FREQ38;}					// In case Raw would have no valid frequency / length header
	}

	let dec = getDecimalFromRaw(raw, freq);
	setField('decimalField', dec.join("L, ") + "L");
	
	let pronto = getProntoFromRaw(raw, freq);
	setField('prontoField', pronto);
	
	let broadlinkHex = getBroadlink(pronto, "26").join("");
	setField('broadlinkField', broadlinkHex);
	setField('broadB64Field', hexToBase64(broadlinkHex));

	setField('rawField', getRawFromPronto(pronto).join(", "));			// In case raw had no header, let's use convert back from Pronto to refresh the whole string

}
function ui_convertBroadlink() {                      // Convert from Broadlink Hex button
	cleanOnClick();
	convertBroadlink(getField('broadlinkField'));
	refreshAll(true);
	setFocus('broadlinkField');
	// return false;
}
function convertBroadlink(broadlinkHex) {             // ** Main- Converts all fields from Broadlink string value ************

	/* Like Raw, Broadlink payload contains absolute time values, meaning that any arbitrary frequency will properly convert to other formats,
	as long as newly generated payloads will be properly converted in target formats where timecodes are factorized (i.e. Pronto) 
	(« non verbum e verbo sed sensum de sensu ») */

	let freq = FREQ38;                                          // Here for the arbitrary frequency

	let raw = getRawFromBroadlink(broadlinkHex).join(", ");
	setField('rawField', raw);

	let dec = getDecimalFromRaw(raw, freq);
	setField('decimalField', dec.join("L, ") + "L");

	setField('broadB64Field', hexToBase64(broadlinkHex));
	
	let pronto = getProntoFromRaw(raw, freq);
	setField('prontoField', pronto);

}
function ui_convertB64() {                            // Convert from Broadlink B64 button
	cleanOnClick();
	convertB64(getField('broadB64Field'));
	refreshAll(true);
	setFocus('broadB64Field');
	// return false;
}
function convertB64(b64) {                            // ** Main- Converts all fields from Broadlink B64 string value ********

	let freq = FREQ38;                                          // See comment in convertBroadlink function

	let broadlinkHex = base64ToHex(b64);
	setField('broadlinkField', broadlinkHex);

	let raw = getRawFromBroadlink(broadlinkHex).join(", ");
	setField('rawField', raw);

	let dec = getDecimalFromRaw(raw, freq);
	setField('decimalField', dec.join("L, ") + "L");
	
	setField('broadB64Field', hexToBase64(broadlinkHex));
	
	let pronto = getProntoFromRaw(raw, freq);
	setField('prontoField', pronto);

}
function getCommandFromShort(short) {                          // Converts short IR command to expanded one i.e. 'A559+A502' to 'a55a 9a65 + a55a 40bf'
	let command = '';                                           //
	while (short.length > 3) {                                  // If not proper groups of pairs, will add a lonely + at the end
		command += necPair(short.slice(0,4));                   //  rather than throw an error
		short = short.slice(4);                                 //  i.e. 'A559+A50' to 'a55a 9a65 +', which sounds better than
	}
	command = formatShort(command, 4, 8);
	if(short) {                                                 // if any extra non-treated values,
		command += ' (+)';                                      //  Marks string to indicate result is partial 
		output += 'Bytes quantity seems invalid - displaying partial conversion\n';
	}
	return command;
}
function getShortFromCommand(hex, opt) {                        // Tries to convert expanded IR command to short one i.e. 'a55a 9a65 + a55a 40bf' to 'A559+A502' 
	//                                                                if opt, function will throw errors and update fields
	let errMsg = '';
	let err1 = ', no pairing found for values in parenthesis. ';
	let err2 = ' (partial conversion)';

	hex = stripHex(hex, 4);                                    // Removes spaces and + signs ; min length set to 4

	if (hex != '') {
		setField('cCommandField', formatShort(hex, 4, 8));
		let short = '';                                       //
		while (hex.length > 3) {                              //
			short += necDepair(hex.slice(0,4))                //
			hex = hex.slice(4);                               // 
		}

		if (short.includes('(')) {errMsg = err1};             // Error on no pairing identified
		if (hex) {errMsg += err2};                            // Error on length (rest left) 
		if (errMsg != '') {
			if (opt) {info('= ' + short + errMsg)};
			return '';
		} 

		return formatShort(short, 0, 4);              // Prepares reformated string with spaces & + for readability
	}
}

// Conversion subfunctions --------------------------------------------------------------------------------------------------->	
function stripHex(string, min) {                           // Strips a string to its hex content, adds %min padding, returns string or ''

	string = string.replace(/[+,;\s/-/"0x"]|/g, '');           // Removes 'Ox", +,;- and all white space signs
	if (/^([0-9A-Fa-f/)]+)$/.test(string)) {
		if (string.length < min) {
			string = string.padStart(min,'0');
		}
		return string                                         // Returns cleaned string if result is 'pure' hex
	};
	return '';
}
function getRawFromPronto(str) {               // Converts Pronto string to Raw
	str = str.replace(/ /g, '');                                             // Removes spaces if any
	let dec = [];
	dec[0] = parseInt(str.substring(0,4),16);                                // Should always be 0000 for Pronto
	dec[1] = parseInt(str.substring(4,8),16);                                // Frequency
	dec[2] = parseInt(str.substring(8,12),16);                               // Number of values #1 (not a word: just add #1 and #2)
	dec[3] = parseInt(str.substring(12,16),16);                              // Number of values #2
	//
	if (dec[0]) {output += 'Pronto code should start with 0000\n'};       // A few checks

	let length = (dec[2] + dec [3]) * 2 + 4;
	if (str.length / 4 != length) {
		output += "Pronto code length header seems wrong. Expected: "
		+ length + " / Actual: " + str.length / 4 + '\n';
	}
	//
	let freq = 1 / (dec[1] * 0.241246);                                      // freq = actual frequency / 1000000
	for (let i = 16; i < str.length; i += 4) {                               // Converts payload
	let tmp = parseInt(str.substring(i,i+4),16);                             //
	dec[dec.length] = Math.round(tmp / freq);                                //
	}
	return dec;                                                              // Returns an array of decimal strings
}	  
function getRawFromBroadlink(str) {
  let dec = [];
  let hex;
  let unit = BRDLNK_UNIT;                                                    // 32.84ms units, or 2^-15s ;
  //
  // dec[0] = parseInt(str.substring(0,2),16);                               // Broadlink header 1: 0x26=IR, 0xb2=RF 433Mhz, 0xd7=RF 315Mhz
  // dec[1] = parseInt(str.substring(2,4),16);                               // Broadlink header 2: number of repeats
  // dec[2] = parseInt(str.substring(6,8) + str.substring(4,6),16);          // Length of payload in little endian
  let length = parseInt(str.substring(6,8) + str.substring(4,6),16);         // Length of payload in little endian
  //
  for (let i = 8; i < length*2+8; i += 2) {                                  // IR Payload
	hex = str.substring(i,i+2),16;
	if (hex == "00") {
	  hex = str.substring(i+2,i+4) + str.substring(i+4,i+6);                   // Quick & dirty big-endian conversion
	  i += 4;
	}
	dec[dec.length] = Math.ceil(parseInt(hex,16) / unit);                    // Will be lower than initial value due to former round()
  }                                                                          // e.g. round(888) * unit then / unit = 884
  // broadlink[broadlink.length] = "0d";                                     // Broadlink footer
  // broadlink[broadlink.length] = "05";                                     // Broadlink footer
  return dec;
}
function getProntoFromRaw(raw,freq) {
  let dec = getDecimalFromRaw(raw,freq);
  let hex = "";
  for (let i = 0; i < dec.length; i ++) {                    // Converts payload
	  hex += dec[i].toString(16).padStart(4, "0") + " ";     //
  }
  return hex.trim();                                         // Removes last-added space
}
function getDecimalFromRaw(raw, freq) {
	let payloadStart;
	let dec = raw.split(',').map(Number);                         // Converts string of comma-separated values into an integer array
	if (dec.length % 2) {                                         // Number of values have to be even
		dec.pop();                                                // Sacrifies the last value - maybe rather add a 0 ? *************
		output += 'Odd string - Had to trim last value\n';
	  }
	let hex = [];
	if (!dec[0] && (dec[2] + dec[3]) * 2 == dec.length - 4) {     // If Pronto header is already coded in raw, 
		hex[0] = 0;                                                 // And copy header values, omitting Pronto-formated freq
		hex[2] = dec[2];                                            //
		hex[3] = dec[3];                                            //
		payloadStart = 4;                                           //
	} else {
		hex[0] = 0;                                                 // If Pronto header isn't in raw, let's build it
		hex[2] = dec.length / 2;                                    // +4 uneeded as the header is not there yet. And no need for Math.floor() due to previous check.
		hex[3] = 0;                                                 // * Will need correction, for packet A and B in [2] and [3] *************
		payloadStart = 0;                                           //
	}
	hex[1] = freqFromHz(freq);                                      // In both cases, update with encoded new frequency (i.e. 109 for 38029 Hz)
	freq = freq / 1000000                                           // But current output format still needs Mhz multiplicator (i.e. 0.038029 Mhz)
	for (let i = payloadStart; i < dec.length; i ++) {              // Converts payload
	  hex.push(Math.round(dec[i] * freq));                          //
	}
	return hex                                                      // Returns an array
}
function getBroadlink(str, type) {              // Converts Pronto string to Broadlink with type = 0x26 (IR) or 0xb2 (RF 433) or 0xd7 (RF 315)
  let dec = getRawFromPronto(str);
  let broadlink = [];
  let unit = BRDLNK_UNIT;                                                 // 32.84ms units, or 2^-15s ;
  let tmp;
  broadlink[0] = type;                                                    // Broadlink header 1: 0x26=IR, 0xb2=RF 433KHz, 0xd7=RF 315MHz
  broadlink[1] = "00";                                                    // Broadlink header 2: number of repeats
  broadlink[2] = "00";                                                    // Provision for Length of code in little endian
  //
  for (let i = 3; i < dec.length; i ++) {                                 // IR Payload
	tmp = Math.floor(dec[i] * unit);                                              // Converts frequency
	if(tmp<256) {                                                                 // 
	  broadlink.push(tmp.toString(16).padStart(2, "0"));                          // Each value is represented by one byte where possible,
	} else {                                                                      // but
	  broadlink.push("00")                                                        // if the length exceeds one byte then it is stored in two big-endian bytes with a leading 0.
	  broadlink.push(((tmp & 0xFF00) >> 8).toString(16).padStart(2, "0"));        // ABCD & FF00 = AB00. With right-shift 8, it becomes AA - and might need a leading 0
	  broadlink.push((tmp & 0xFF).toString(16).padStart(2, "0"));                 // ABCD & 00FF = CD
	}
  }
  broadlink.push("0d");                                     // Broadlink footer
  broadlink.push("05");                                     // Broadlink footer
  //
  tmp = broadlink.length - 6;                                             // Packet length
  broadlink[2] = (tmp & 0xFF).toString(16).padStart(2, "0");              // ABCD & 00FF = CD, to place in first byte since little-endian is required
  broadlink[3] = ((tmp & 0xFF00) >> 8).toString(16).padStart(2, "0");     // ABCD & FF00 = AB00. With right-shift 8, it becomes AA - and might need a leading 0
  //
  tmp = (broadlink.length + 4) % 16;                                            // rm.send_data() will add 4-byte header (02 00 00 00)
  if (tmp) {                                                                    // and ultimate packet size will have to be a multiple of 16 
	for (let i = 0; i < 16-tmp; i ++) {                                         // for 128-bit AES encryption,
	  broadlink.push("00")                                                      // so, add 00s to fit global packet size
	}        
  }
  return broadlink;                                                                             // Returns an array of hex strings
}
function hexToDec(str) {                        // Converts an hex string to decimal, returns an array
	str = str.replace(/ /g, '');                  // Removes spaces if any
	let dec = [];
	for (let i = 0; i < str.length; i += 4) {
	let tmp = str.substring(i,i+4);
	dec[dec.length] = parseInt(tmp,16);
	}
	return dec;
}
function decToHex(str) {                        // Converts a decimal string to hex values, returns a string
	str = str.replace(/[L ]/g, '');
	let dec = str.trim().split(',').map(byte => parseInt(byte));
	let hex = dec.map((e) => e.toString(16).padStart(4, "0"));
	return hex.join(' ');
}
function buildRaw(header,one,zero,ptrail,gap,bin) {      // Generates Raw from Lirc command, returns command as string of decimals with ',' separators

	// Note that there's no frequency involved here yet, as the value themselves contain the time codes to be emitted  

	let str = [], raw = [];
	str[0] = cleanHeader(zero);                      // Builds a small temp array to store zero and one strings,
	str[1] = cleanHeader(one);                       // while cleaning separators in the three fields that have multiple values
	header = cleanHeader(header);                    //
	
	if (header) {raw.push(header)};

	for (i = 0; i < bin.length; i++) {              // IR Payload (can't use 'i in bin' here as i needs to be numerical)
		raw.push(str[parseInt(bin.charAt(i))]);     // Pushes zero or one string
		if (!((i+1) % 32)) {						// Pushes a ptrail every 32 bits (bit 0 will always be skipped as test starts at i+1) 
			if (ptrail) {raw.push(ptrail)};         // 
			if (bin.length > i +1) {
				if (header) {raw.push(header)};     // Pushes header at the end (if length is a multiple of 32)
			}
		}
	}
	if (gap) {raw.push(gap)};                       // Completes by pushing gap

	info(header + ', [' + bin + '], ' + ptrail + ',' + gap);

	return raw.join(',');
}
function cleanHeader(str) {
	str = str.replace(/[ ;\+\-]/g, ',');                      // Replaces spaces, ; + or - with commas if any
	str = str.replace(/(\,){2,}/g, '$1');                     // Replaces multiple ",,," with single "," separator
	return str;
}
function necPair(hex) {                                  // Converts one pair of Pioneer hex code to Pronto header i.e. 'A559' to 'a55a 9a65'
	let pronto = '';                                         //  
	let device = toLsb(parseInt(hex.slice(0,2), 16));        //        A5 converted to little-endian (A5)
	let functn = toLsb(parseInt(hex.slice(2,4), 16));        //        59 converted to little-endian (9A)
	pronto += device.toString(16).padStart(2, '0');          //        Writes A5
	pronto += invert(device).toString(16).padStart(2, '0');  //        Bit-inverts A5 and writes 5A
	pronto += ' ';                                           //        Uneeded separator
	pronto += functn.toString(16).padStart(2, '0');          //        Writes 9A
	pronto += invert(functn).toString(16).padStart(2, '0');  //        Bit-inverts 9A and writes 65
	return pronto;
}
function necDepair(hex) {                                // Reverts one pair of Pronto hex header to single byte of command  i.e. 'a55a' to 'A5', or '9a65' to '59'
	let byte1 = parseInt(hex.slice(0,2), 16);                // a5 & 5a should still be lsb left at this stage,
	let byte2 = parseInt(hex.slice(2,4), 16);                // but who cares?
	if (byte1 == invert(byte2)) {                            // Pair match:
		return toLsb(byte1).toString(16).padStart(2, '0');   //   decodes and return first byte as hex string
	} else {
		return ' (' + hex + ') ';
	}
}
function toLsb(byte) {                                   // Inverts bits order in a byte:  11000001 becomes 10000011
	let lsb = 128 * (byte & 1);                              // ugly & dirty, but fast LSB to MSB (or MSB to LSB)
	lsb += 64 * ((byte & 2) != 0);
	lsb += 32 * ((byte & 4) != 0);
	lsb += 16 * ((byte & 8) != 0);
	lsb += 8 * ((byte & 16) != 0);
	lsb += 4 * ((byte & 32) != 0);
	lsb += 2 * ((byte & 64) != 0);
	lsb += 1 * ((byte & 128) != 0);
	return lsb;
}
function invert(byte) {                                  // Inverts every bit value in a byte: 11000001 becomes 00111110
	return byte ^ 255;                                     // could as well be 255 - byte
}
function hexToBase64(str) {                              // _Converts string of hex values ==> Ascii ==> Base 64
  return window.btoa(String.fromCharCode.apply(null,
	str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
  );
}
function base64ToHex(str) {                              // _Converts Base 64 ==> Ascii ==> hex string of values
  let bin = window.atob(str.replace(/[ \r\n]+$/, ""));
  let hex = [];
  let tmp;
  for (let i = 0; i < bin.length; ++i) {
	tmp = bin.charCodeAt(i).toString(16);
	if (tmp.length === 1) tmp = "0" + tmp;
	hex[hex.length] = tmp;
  }
  return hex.join("");
}
function hexTobin(hex) {                                 // Converts hex string to binary with 16 0-padding
	//                                                                 Examples:
	let bin = "";                                                   //  a5               -> 0000000010100101
	let tmphex;                                                     //  a55a + d926 f50a -> 101001010101101011011001001001101111010100001010
	//
	hex = hex.replace(/[+]| /g, '');                                // Removes spaces and + signs if any
	//
	while (hex.length) {                                            // JS fails with long hex strings, max length seems to be 12 chars 
		tmphex = "0x" + hex.slice(-4);                                  // Slices Hex number in 4-chars hex slices / 16 bits
		bin = parseInt(tmphex).toString(2).padStart(16,"0") + bin;
		hex = hex.substring(0,hex.length - 4);
	}
	return bin;
}  

// Can be deleted ------------------------------------------------------->

