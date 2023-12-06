var readFileInProgress = false;
var tableArray = [];
var regexLevel1 = /^[1-5]$/;
var regexStandard1Level1 = /^[a-d]\.?$/;
// var regexLevel2 = /^[a-d]\.?|[1-9]\.[1-9]$/;

var regexStandard1Level2 = /^[a-d][1-9]\.?$/;
var regexLevel2 = /^[1-9]\.[1-9]$/;

var scoreboardResult = [];


$(document).ready(function () {

    $("#fileScoreboard").change(function () {
        if (!readFileInProgress) {
			readFileInProgress = true;
            let file = this.files[0];
			 console.log(file);
			// reportData = [];
			readFileScoreBoard(file); // Trigger the function when a file is uploaded
        }
    });

    $('#btnCopyOutput').on('click', function () {
		// Get the content of the modal body
		var modalBodyContent = $('#output').get(0);
		const range = document.createRange();
		range.selectNodeContents(modalBodyContent);
		// Copy the selected HTML content to the clipboard
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		document.execCommand("copy");
		selection.removeAllRanges();
		alert('Đã copy!');

	});

});


async function readFileScoreBoard(file) {
    // console.log("readFileScoreBoard");
    var reader = new FileReader();

    reader.onload = function (e) {
        var arrayBuffer = e.target.result;
	    var options = { arrayBuffer: arrayBuffer };
        // Convert the Word document to HTML using mammoth.js
        mammoth.convertToHtml(options)
        .then(function (result) {
            $(result.value).find('tr').each(function (rowIndex, row) {
                var rowData = [];
            
                // Find all td elements within the current tr
                var cells = $(row).find('td');
            
                // Check if the first cell is empty
                var firstCellText = $(row).find('td').eq(0).text().trim();
                var benchmark = $(row).find('td').eq(2).text().trim();
                if (firstCellText !== "" && benchmark!== "") {



                    // Iterate over each td and push its text content into rowData
                    cells.each(function (colIndex, cell) {
                        rowData.push($(cell).text());
                    });
            
                    // Push the row data into the array
                    tableArray.push(rowData);
                }
            });

            // console.log(tableArray);
            scoreboardResult =  processTableData(tableArray);
            console.log(scoreboardResult);
            var htmlScoreboardResult='';
            scoreboardResult.array.forEach(element => {
                if (element.bold)
                    htmlScoreboardResult+= '<b>'+element.title + ': ' + element.text+'</b>';
                else
                    htmlScoreboardResult+= '<span>'+element.title + ': ' + element.text+'</span>';
                htmlScoreboardResult+= '<br>';
            });
            htmlScoreboardResult+= 'Tại thời điểm kiểm tra: Tổng số điểm Đoàn thẩm định thống nhất với Phòng Tài nguyên và Môi trường là <b>'+ toFormatString(scoreboardResult.finalScore) +' điểm</b>.';
            $("#output").html(htmlScoreboardResult);
            $("#output").addClass('p-lg-3');
        })
        // .catch(handleError);
    };


  	reader.readAsArrayBuffer(file);
	readFileInProgress = true;
}

function handleError(error) {
    console.error('Error reading Word document:', error);
}

function processTableData(data) {
    console.log("parseTableData");
    var resultArray =[];
    var sumPlusScore = 0;
    var sumMinusScore = 0;
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var level = row[0].trim();
        var benchmark = myParseFloat(row[2].trim());
        
        // var score_int = parseInt(score);
        var summaryChilren;
        console.log(level);
        if (regexLevel1.test(level)){
            if (level === "1") {
                summaryChilren = readSummaryStandard1(data, i);
            }
            else {
                summaryChilren = readSummaryChilren(data, i, regexLevel2, regexLevel1)
            }
            var plusScore = summaryChilren.sumPlusScore | myParseFloat(row[3]);
            var minusScore = summaryChilren.sumMinusScore | myParseFloat(row[4]);
            sumPlusScore += plusScore;
            sumMinusScore += minusScore;
            var object = {
                title : '+ Tiêu chuẩn ' + level,
                text : buidChildText(benchmark, plusScore, minusScore),
                bold : true
            };
            resultArray.push(object);
            resultArray.push(...summaryChilren.children);
            i = summaryChilren.nextIndex;
        }
    }
    return {
        finalScore : 100 + sumPlusScore - sumMinusScore,
        array: resultArray
    };
}

function readSummaryStandard1(data, index) {
    var resultStandard1Children = [];
    var sumPlusScore = 0;
    var sumMinusScore = 0;
    var i;
    for (i = index+1; i < data.length; i++) {
        var row = data[i];
        var level = row[0].trim().toLowerCase();
        console.log("readSummaryStandard1: " + level);
        if (regexStandard1Level1.test(level)) {
            var summaryChilren = readSummaryChilren(data, i, regexStandard1Level2, regexStandard1Level1)
            console.log(summaryChilren);
            var benchmark = myParseFloat(row[2].trim());
            var plusScore = summaryChilren.sumPlusScore;
            var minusScore = summaryChilren.sumMinusScore;
            sumPlusScore += plusScore;
            sumMinusScore += minusScore;
            var object = {
                title : '- Mục ' + level.replace(".", ""),
                text : buidChildText(benchmark, plusScore, minusScore),
                bold : true
            };
            resultStandard1Children.push(object);
            resultStandard1Children.push(...summaryChilren.children);
            i = summaryChilren.nextIndex;
        }
        else if (regexLevel1.test(level)){
            // console.log("break readSummaryStandard1");
            break;
        }
    }
    return {
        children : resultStandard1Children,
        sumPlusScore : sumPlusScore,
        sumMinusScore : sumMinusScore,
        nextIndex : i - 1 
    }
}


function readSummaryChilren(data, index, regex, breakRegex) {
    
    var resultChildren = [];
    var sumPlusScore = 0;
    var sumMinusScore = 0;
    var i;
    for (i = index+1; i < data.length; i++) {
        var row = data[i];
        var level = row[0].trim().toLowerCase();
        // console.log("readSummaryChilren: " + level);
        if (regex.test(level)) {
            var benchmark = myParseFloat(row[2].trim());
            var plusScore = myParseFloat(row[3].trim());
            console.log(typeof plusScore);
            sumPlusScore += plusScore;
            var minusScore = myParseFloat(row[4].trim());
            sumMinusScore += minusScore;
            console.log(sumPlusScore);
            var object = {
                title : '   Mục ' + level,
                text : buidChildText(benchmark, plusScore, minusScore),
                bold : false
            }
            resultChildren.push(object);

        }
        else if (breakRegex.test(level) || regexLevel1.test(level))
        {
            // console.log("break");
            break;
        }
    }

    return {
        children : resultChildren,
        sumPlusScore : sumPlusScore,
        sumMinusScore : sumMinusScore,
        nextIndex : i - 1
    }
}

function buidChildText(benchmark, plusScore, minusScore) {
    var buidText = 'Điểm chuẩn '+ toFormatString(benchmark) + ' điểm';
    if (plusScore !== '' && plusScore !== 0)
    {
        buidText += ', cộng '+ toFormatString(plusScore) +' điểm';
    }
    if (minusScore !== '' && minusScore !== 0)
    {
        buidText += ', trừ '+ toFormatString(minusScore) +' điểm';
    }
    var finalScore = benchmark + plusScore - minusScore;
    console.log(finalScore);
    buidText += ', thống nhất đạt '+ toFormatString(finalScore) +' điểm.';
    return buidText;
}

function myParseFloat(str) {
    if (str === '') {
        return 0;
    }
    if (typeof str === 'string') { 
        return parseFloat(str.replace(",", ".").replace("+", "").replace("-", ""));
    }
    else return parseFloat(str);
}

function toFormatString(value) {
    return value.toString().replace('.', ',');
}