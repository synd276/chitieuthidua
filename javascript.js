var reportData = [];
var excelArrayDiemChuan;
var readFileInProgress = false;

// function loadAndReadFile(link) {
//  var fileUrl = link + '&download=1';

//         $.ajax({
//           url: fileUrl,
//           type: 'GET',
//           dataType: 'binary',
//           responseType: 'arraybuffer',
//           processData: false,
//           success: function (data) {
//             var arrayBufferView = new Uint8Array(data);
//             var fileBlob = new Blob([arrayBufferView], { type: 'application/octet-stream' });
//             readFileBlob(fileBlob);
//           },
//           error: function (xhr, status, error) {
//             console.error(error);
//           }
//         });
//       }
// function readFileBlob(file) {
//         var reader = new FileReader();

//         reader.onload = function (e) {
//           var arrayBuffer = e.target.result;
//           var mammothOptions = { includeDefaultStyleMap: true };

//           var result = mammoth.extractRawText({ arrayBuffer: arrayBuffer }, mammothOptions)
//             .then(function (result) {
//               var text = result.value;
//               var lines = text.split('\n');
//               var data = [];

//               lines.forEach(function (line) {
//                 data.push({ text: line });
//               });

//               $("#output").jstree({
//                 core: {
//                   data: data,
//                 },
//               });
//             });
//         };

//         reader.readAsArrayBuffer(file);
//       }      
async function readFile(file) {
	// console.log("readFile");
  	var reader = new FileReader();

  	reader.onload = function (e) {
		var arrayBuffer = e.target.result;
		var options = { arrayBuffer: arrayBuffer };

		// Use mammoth.js to extract the text content from the Word file
		mammoth.extractRawText(options)
		.then(function (result) {
			var text = result.value;
			var lines = text.split("\n");
			var keyLevel1 = $("#level1").val();
			var keyLevel2 = $("#level2").val();
			var keyLevel3 = $("#level3").val();
			
			var keywordFound = 0;
			//tìm từ khóa đầu tiên
			for (var keywordFound = 0; keywordFound < lines.length; keywordFound++) {
				if (lines[keywordFound].includes(keyLevel1)) {
					break;
				}
			}
			if (keywordFound >= lines.length) {
				alert('Không tìm thấy từ khóa: '+ keyLevel1);
				return;
			}
			// console.log("found keyword at: " + keywordFound);
			// var levelFound = 0;
			var level;
			var iDiemChuan = 1;
			var currentParents = [];
			var score;
			var diemChuan;
			//run throught every line of the file 
			for (var i = keywordFound; i < lines.length; i++) {
				var line = lines[i].trim();
				level = 0;
				if (line !== "") {
				
					//checking key level
					if (line.includes(keyLevel1)){
						level = 1;
					}
					else if (line.includes(keyLevel2)){
						level = 2;
					}
					else if (line.includes(keyLevel3)){
						level = 3;
					}
					//else {
					//	level = 4;
					//}
					score = 0;
					diemChuan = undefined;
					title = undefined;
					if (level > 0) {
						score = extractScores(line);
						diemChuan = excelArrayDiemChuan[iDiemChuan][2];
						iDiemChuan++;
						title =  extractTitles(line);
						if (title === undefined) {
							// let previousTitle = extractTitles(lines[i-1].trim());
							let previousTitle = currentParents[currentParents.length - 1].title;
							let tempTitle = incrementLastNumber(previousTitle);
							if (line.includes(tempTitle)) {
								title = tempTitle;
							}
						}
					}

					var lineData = { title: title, text: line, level: level, score : score, benchmark : diemChuan };
					// var lineData = { level: level, score : score, benchmark : diemChuan };;


					if (level === 0) {
					if (currentParents.length > 0) {
						currentParents[currentParents.length - 1].children =
						currentParents[currentParents.length - 1].children || [];
						currentParents[currentParents.length - 1].children.push(lineData);
					} else {
						reportData.push(lineData);
					}
					} else {
					while (currentParents.length >= level) {
						currentParents.pop();
					}

					if (currentParents.length > 0) {
						currentParents[currentParents.length - 1].children =
						currentParents[currentParents.length - 1].children || [];
						currentParents[currentParents.length - 1].children.push(lineData);
					} else {
						reportData.push(lineData);
					}

					currentParents.push(lineData);
					}
				}
			}

			// console.log(reportData);
			$("#output").jstree({
			core: {
				data: reportData,
			},
			});
		})
		.catch(function (error) {
			console.error('Error extracting text:', error);
			// $("#output").html("Error reading file.");
		});
	};

  	reader.readAsArrayBuffer(file);
	readFileInProgress = true;
}

function incrementLastNumber(inputString) {
	// console.log("incrementLastNumber: " + inputString);
    // Check if the input is a non-empty string
    if (typeof inputString !== 'string' || inputString.length === 0) {
        return inputString;
    }

    // Find the last number in the string
    const match = inputString.match(/\d+$/);

    // If there is a match, increment the number
    if (match) {
        const lastNumber = parseInt(match[0]);
        const incrementedNumber = lastNumber + 1;
        const resultString = inputString.replace(/\d+$/, incrementedNumber);
        return resultString;
    } else {
        console.log('No number found at the end of the string: ' + inputString);
		return inputString;
    }
}

function extractScores(line)
{
	const match = line.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?)(?=\s*\/)/);

    if (match) {
      // Extract the matched number and remove any commas
      let extractedNumber = match[0].replace(',', '.');
      return parseFloat(extractedNumber);
    }
}
function extractTitles(line)
{
	// console.log(line);
	const pattern = /^(.*?)(?:\. |: )/;
	
	let match = line.match(pattern);
		
	if (match){
		return match[1].replace("+", "").replace("-", "").trim();
	  }
}
//read file DiemChuan then set value to excelArrayDiemChuan
function readDiemChuan() {
	var excelFileName = 'DiemChuan.xlsx';

	$.ajax({
		url: excelFileName,
		dataType: 'binary', // Use 'binary' data type to handle Excel files
    	processData: false,  // Prevent data processing
		method: 'GET',
		// processData: false,
		// responseType: 'arraybuffer',
		xhrFields: {
			responseType: 'arraybuffer'
		},
		success: function (data) {
			var dataUint8 = new Uint8Array(data);

			var workbook = XLSX.read(dataUint8, { type: 'array' });
			var sheetName = workbook.SheetNames[0];
			var sheet = workbook.Sheets[sheetName];
			excelArrayDiemChuan = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

			// console.log(excelArrayDiemChuan);
		},
		error: function (xhr, status, error) {
			console.error('Error loading the Excel file:', xhr);
			console.error('Error status:', status);
			console.error('Error:', error);
		}
	});
}

//lọc lấy các mục có điểm cộng
function filterObjectsByBenchmark(arr) {
	return arr.reduce((result, obj) => {
		const filteredChildren = obj.children ? filterObjectsByBenchmark(obj.children) : [];

		if (obj.score > obj.benchmark) {
		result.push({
			title: obj.title,
			text: obj.text,
			level: obj.level,
			score: obj.score,
			benchmark: obj.benchmark,
			children: filteredChildren,
			diffScore: parseFloat((obj.score - obj.benchmark).toFixed(1))
		});
		}

		return result;
	}, []);
}

function getResultReportLine(element, isBold = false) {
	let result = element.title + ": + " + element.diffScore + " điểm.";
	if (isBold)
		result = "<b>" + result+"</b>";
	else 
		result = '   ' + result;
	// console.log(result);
	return result
}

//xuất danh sách
async function getResultReportDetails(input) {
	// console.log(input);
	let filteredInput = filterObjectsByBenchmark(input);
	//  console.log('did filterObjectsByBenchmark');
	//  console.log(filteredInput);
	let output = [];
	let summary = 0;
	flag = false;
	filteredInput.forEach(element => {
		output.push(getResultReportLine(element, true));
		summary += element.diffScore;
		if (element.children) {
			element.children.forEach(elementChild => {
				if (flag) {
					output.push(getResultReportLine(elementChild));
				}

				if (elementChild.children) {
					elementChild.children.forEach(elementChildChild => {
						output.push(getResultReportLine(elementChildChild));
					});
				}
			});
		}

		flag = true;
	});
	output.unshift("<b>+ Điểm thưởng: " + summary.toFixed(1) + " điểm bao gồm:</b>");
	return output;
}

function PrintToModal(arrReportDetail) {
	// console.log(arrReportDetail);
	const modalBody = document.getElementById('myModal-body');

	// Create a string containing the array items
	const arrayText = arrReportDetail.join('<br>'); // Use <br> for line breaks

	// Set the HTML content of the div
	modalBody.innerHTML = arrayText;
}

async function waitForReportDataAndPrintToModal() {
	// console.log('waitForReportDataAndPrintToModal');
    return new Promise((resolve) => {
        async function checkData() {
            if (reportData !== null) {
                
				let reportDetail = await getResultReportDetails(reportData);
				// console.log(reportDetail);
				PrintToModal(reportDetail);
				resolve(reportData);
				$('#btnShowModal').removeClass('disabled');
            } else {
                // If data is not available, wait for a short interval and then check again
                setTimeout(checkData, 200); // Adjust the interval as needed
            }
        }

        checkData(); // Start checking immediately
    });
}



$(document).ready(function () {
	readDiemChuan();

	$('#output').on('loaded.jstree', function (event, data) {
		// This callback is called when the tree has finished loading
		// console.log('jsTree has finished loading data');
		waitForReportDataAndPrintToModal();
	});

	$("#fileInput").change(function () {
		if (!readFileInProgress) {
			readFileInProgress = true;
			$('#btnShowModal').addClass('disabled');
			let file = this.files[0];
			// console.log(file);
			reportData = [];
			readFile(file); // Trigger the function when a file is uploaded
		}
	});

	// $("#readButton").click(function () {
	// 	 readFile($("#fileInput")[0].files[0]);
		 
	// });
	
	// $("#Export").click(function () {
	// 	waitForReportDataAndPrintToModal();
	// });

    // Attach a click event handler to close the modal
    $(".modal").click(function () {
        // Close the modal by removing the class
        $(this).removeClass("modal-open");
    });

    // Prevent clicks inside the modal from closing it
    $(".modal-inner").click(function (event) {
        event.stopPropagation();
    });

	var inputArray = ["TIÊU CHUẨN", "Mục ", "Phần "]; // Array to store the input elements

	// Loop through each input element
	$("input[type='text']").each(function(index) {
		$(this).val(inputArray[index]); // Set the value of the current input element
	});


	//copy
	$('#btnCopy').on('click', function () {
		// Get the content of the modal body
		var modalBodyContent = $('#myModal-body').get(0);
		
		// const htmlContent = html;
		// Create a temporary element to hold the HTML content
		// const tempElement = document.createElement("div");
		// tempElement.attr('background-color', 'transparent');
		// tempElement.innerHTML = modalBodyContent;
		// document.body.appendChild(tempElement);
		// Select the HTML content
		const range = document.createRange();
		range.selectNodeContents(modalBodyContent);
		// Copy the selected HTML content to the clipboard
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		document.execCommand("copy");
		selection.removeAllRanges();
		// document.body.removeChild(tempElement);

		// Optionally, provide feedback to the user
		alert('Đã copy!');


		 // Use the Clipboard API to write text to the clipboard
		//  navigator.clipboard.write(modalBodyContent)
		//  .then(function () {
		// 	 // Successfully copied
		// 	 alert('Content copied to clipboard!');
		//  })
		//  .catch(function (err) {
		// 	 // Unable to copy
		// 	 console.error('Unable to copy to clipboard', err);
		//  });
	});
});