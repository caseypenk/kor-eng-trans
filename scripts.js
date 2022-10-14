/* To do
- Color the word based on the part of speech. Make the subject particle the same color as the subject but a lighter hue. Make the object marker particle the same color as the object but a lighter hue. Make the verb red (end of sentence).
- Change from a simply key-value pair dictionary to an object based one with more info per entry
*/

function initialize() {
	twemoji.parse(document.body); // Twitter emoji (consistent visual identity across devices)
	var largeDictionary = setUpDictionary(); // load Korean dictionary
	continuouslyTranslate(largeDictionary); // translate the inputted text on a regular basis
}

function continuouslyTranslate(largeDictionary) {
	let originalText; // set up a variable that will store the original Korean text so we can check for updates later
	let dictionarySize = 0; // store a value for dictionary size so we can check when the dictionary has been loaded
	let userPrefDisplayHanja = document.getElementById("user-pref-hanja").checked; // default value for whether Hanja should be displayed

	setInterval(function(){

		if (originalText != document.getElementById("original").value // check whether the original Korean text has been updated since the previous execution of the loop. If it has been changed, update the translation. If it hasn't been changed, keep the existing translation as-is (and don't use additional system resources).
		|| document.getElementById("translation").innerHTML == undefined // check whether the translation is empty (listen intently to see if a translation needs to be added)
		|| largeDictionary.size != dictionarySize  // check whether the dictionary has recently loaded in (dictionary loads in concurrently / asynchronously with translation)
		|| userPrefDisplayHanja != document.getElementById("user-pref-hanja").checked) { // check whether the user has recently changed their preferences for displaying Hanja
			
			dictionarySize = largeDictionary.size; // update the dictionary size once the dictionary has loaded in
			userPrefDisplayHanja = document.getElementById("user-pref-hanja").checked; // update the flag based on the current status of the checkbox
			
			originalText = document.getElementById("original").value; // get user-entered text from the textarea input
			prepareSpacing(originalText); // prepare the grid spacing to be used for placing the translated text
			let translation = translateText(originalText, largeDictionary); // get the translation from Korean to English
			displayTranslation(translation, userPrefDisplayHanja);

			/* if (userPrefDisplayHanja) {
				displayHanja(translation);
			} else {
				document.getElementById("hanja").innerHTML = ""; // clear display of Hanja if the user turns the preference off
			} */
		}
	}, 100);
}

function setUpDictionary() { // load in dictionary from kengdic source file
	var output = new Map();
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		document.getElementById("loading-bar").innerHTML = "⏳ loading dictionary...";
			if (xhttp.readyState == 4 && xhttp.status == 200) {
					let temp = xhttp.responseText.trim().split('\t');
					for (let i = 0; i < temp.length / 11; i++) {
						/* output.push([]); // array approach
						output[i].push(temp[i * 11]);
						output[i].push(temp[i * 11 + 1]); */
						
						output.set(temp[i * 11 + 1], [temp[i * 11 + 3], temp[i * 11 + 9]]); // store k-v pairs in Map object.. the values are an array
						
						/* if (i % 100 == 0) { // this doesn't actually display the updated loading progress - consider fixing it
							document.getElementById("loading-bar").innerHTML = "the" + i * 11 / temp.length + "loaded";
							console.log(i);
						} */
					}
					document.getElementById("loading-bar").innerHTML = "✅ done loading dictionary!"; // TO DO make this fade out over 5 seconds
			}	
	};
	xhttp.open("GET", "kengdic_2011.tsv", true);
	xhttp.send();
	return output;
}

function translateText(originalText, largeDictionary) {

	let translatedSentence = [];

	/* const complexDictionary = { // turn this into a prototype object https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_prototypes
		Korean: "우리",
		English: "we",
		partOfSpeech: "noun", // used to change the original and translated text to a unique color for that part of speech (green for subject, yellow for object, red for verb - as in a stop light)
		formality: "neutral"
	}; */

	const customDictionary = new Map([ // Start with a small, fast dictionary of the most common Korean words before resorting to large complex dictionary
	['우리', 'we'],
	['항상', 'always'],
	['나', 'I (formal)'], // dictionary entries should have a formality entry / indicator as additional contextual info for learners. Formal / informal which would then be displayed to user using a meter, similar to Grammarly meter
	// start with particles, which are extremely common and need to be explained carefully
	['너','you'],
	['난', ' as for me'],
	['다', 'all'],
	['아니', 'no'],
	['이 ', '(subject marker [following consonants])'],
	['가 ', '(subject marker [following vowels])'],
	['은 ', '(topic marker [following consonants])'],
	['는 ', '(topic marker [following vowels])'],
	['를 ', '(object marker [following vowels])'],
	['을 ', '(object marker [following vowels])'],
	['에 ', '(location marker)'],
	['에서 ', '(location marker)'],
	['와 ', 'and'],
	['자유럽', 'free'],
	['였', 'was'],
	['해','do'],
	['니다', 'formal verb ending'],
	['요', '(informal polite sentence ending)'],
	['함께', 'together'],
	['long', 'LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG LONG '],
	// include proper nouns
	['방탄소년단', 'BTS']
	]); // Could also be object-based for multiple dimensions, as in https://pietschsoft.com/post/2015/09/05/javascript-basics-how-to-create-a-dictionary-with-keyvalue-pairs

	for (let i = 0; i < originalText.length; i++) {

		let translatedWord;
		let translatedHanja;
		let j = originalText.length;
		let wordLength = j - i + 1;

		while (translatedWord == undefined && j > i) { // Search for multi-character words
			let snippetToSearch = originalText.substring(i, j); // might want to change this to search for longer words first (start with the biggest possible substring, then narrow it down to smaller substrings... so as not to have false positive translations for short characters that are commonly used as components of larger words)
			translatedWord = customDictionary.get(snippetToSearch); // try the custom dictionary first
			if (translatedWord == undefined) { // if the custom dictionary doesn't find a translation...
				if (largeDictionary.get(snippetToSearch)) {
					translatedWord = largeDictionary.get(snippetToSearch)[0]; // ...try the large dictionary
					translatedHanja = largeDictionary.get(snippetToSearch)[1];
				}
			}
			j--;
			wordLength--; // use this to skip spaces later on
		}
		
		if (translatedWord == "NULL") translatedWord = undefined; // ignore NULL entries in dictionary (data errors)
		if (translatedHanja == "NULL") translatedHanja = undefined;

		translatedSentence.push([translatedWord, translatedHanja, wordLength]);
		i = i + wordLength - 1; // skip ahead past the word that was just translated (so the second/third/etc. characters of the word aren't translated separately)
	}

	return translatedSentence;
}

function prepareSpacing(input) { // prepare to space out translation to match the spacing of the original entered text

	document.getElementById("original-divided").innerHTML = ""; // clear old spaces

	for (let i = 0; i < input.length; i++) {

		let singleCharacter = document.createElement("div");
		singleCharacter.innerHTML = input[i];

		if (input[i] == " ") {
			singleCharacter.innerHTML = "&nbsp;"; // Every div must have content (such as an nbsp) in it in order to take up space. A regular space will display with 0 width, throwing off spacing.
		}

		singleCharacter.classList.add("original-divided-character");
		document.getElementById("original-divided").appendChild(singleCharacter);
	}
}

function displayTranslation(input, userPrefDisplayHanja) {

	var numberOfWords = input.length;
	document.getElementById("translation").innerHTML = ""; // clear old English
	document.getElementById("hanja").innerHTML = ""; // clear old Hanja
	let characterSpacings = document.getElementsByClassName("original-divided-character");
	
	if (userPrefDisplayHanja) {
		numberOfTimes = 2;
	} else {
		numberOfTimes = 1;
	}

	for (let k = 0; k < numberOfTimes; k++) {
		let positionInSpacings = 0;

		for (let i = 0; i < numberOfWords; i++) { // go through each translated word, one at a time
			let translation = input[i][k]; // in the translation array, the first element of each element is the English translation
			let originalWordLength = input[i][2]; // in the translation array, the second element of each element is the length of the original Korean word
			let translatedWord = document.createElement("div");
			translatedWord.classList.add("translated-word");
			translatedWord.style.width = characterSpacings[positionInSpacings].offsetWidth + "px"; // match the displayed translation width with the width of the corresponding Korean word
			if (input[i][0] != undefined) { // if the word was successfully translated (and is not an English word, character, etc.)
				
				translatedWord.innerHTML = translation; // access the English translation of the word
				if (translation == undefined) translatedWord.innerHTML = "";

				let wordColor = generateColor();
				if (k == 1) wordColor = "black";

				if (k==0) translatedWord.style.borderBottom = "3px solid " + wordColor;
				translatedWord.style.color = wordColor;
			
				if (originalWordLength > 1) { // for multi-character words make the div for the translation of that word wider (use all available horizontal space)
					for (let j = 1; j < originalWordLength; j++) {
						translatedWord.style.width = parseInt(translatedWord.style.width) + characterSpacings[positionInSpacings + j].offsetWidth + "px"; // add the widths of the second, third, etc. characters
					}
					positionInSpacings = positionInSpacings + originalWordLength - 1; // for multi-character words, advance position in spacings to account for multiple characters used
				}
			}

			if (k == 0) document.getElementById("translation").appendChild(translatedWord);	// add the translation as a part of the translation section
			if (k == 1) document.getElementById("hanja").appendChild(translatedWord);

			positionInSpacings++;
		}
	}
}

function generateColor() { // give the word a random color to visually separate it from the other translated words
	let red;
	let green;
	let blue;

	do { // must generate colors at least once
		red = 150 + Math.random()*106; // baseline of 150 so they are bright, cheerful colors
		green = 150 + Math.random()*106; // baseline of 150 so they are bright, cheerful colors
		blue = 150 + Math.random()*106; // baseline of 150 so they are bright, cheerful colors
	} while (red > 200 && green > 200 && blue > 200 // if all colors are too bright / white, which makes them hard to read on a screen
		|| red > 210 && green > 190 // if the resultant color is yellow (which is hard to read on a screen) or orange (which is unpleasant)
		|| green > 240 // if the  color is high in green, which is hard to read on a screen
		|| (Math.abs(red - green) < 25 || Math.abs(green - blue) < 25 || Math.abs(blue - red) < 30)); // if the colors are too close together, while makes for browns
	
	if (document.getElementById("user-pref-taegukgi").checked) {
		let whichColor = Math.random() * 3;
		if (whichColor < 1) { // official red
			red = 205;
			green = 46;
			blue = 58;
		} else if (whichColor < 2) { // official blue
			red = 0;
			green = 71;
			blue = 160;
		} else { // black
			red = 0;
			green = 0;
			blue = 0;
		}
	}
	return "rgb(" + red + "," + green + "," + blue +")";;
}