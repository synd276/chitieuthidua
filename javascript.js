var data = [];
function loadAndReadFile(link) {
 var fileUrl = link + '&download=1';

        $.ajax({
          url: fileUrl,
          type: 'GET',
          dataType: 'binary',
          responseType: 'arraybuffer',
          processData: false,
          success: function (data) {
            var arrayBufferView = new Uint8Array(data);
            var fileBlob = new Blob([arrayBufferView], { type: 'application/octet-stream' });
            readFileBlob(fileBlob);
          },
          error: function (xhr, status, error) {
            console.error(error);
          }
        });
      }
function readFileBlob(file) {
        var reader = new FileReader();

        reader.onload = function (e) {
          var arrayBuffer = e.target.result;
          var mammothOptions = { includeDefaultStyleMap: true };

          var result = mammoth.extractRawText({ arrayBuffer: arrayBuffer }, mammothOptions)
            .then(function (result) {
              var text = result.value;
              var lines = text.split('\n');
              var data = [];

              lines.forEach(function (line) {
                data.push({ text: line });
              });

              $("#output").jstree({
                core: {
                  data: data,
                },
              });
            });
        };

        reader.readAsArrayBuffer(file);
      }      
function readFile(file) {
  var reader = new FileReader();

  reader.onload = function (e) {
    var arrayBuffer = e.target.result;
    var options = { arrayBuffer: arrayBuffer };

    // Use mammoth.js to extract the text content from the Word file
    mammoth.extractRawText(options)
      .then(function (result) {
        var text = result.value;
        var lines = text.split("\n");
        var data = [];
		var foundKeyword = false;
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
		console.log("found keyword at: " + keywordFound);
		var levelFound = 0;
		var level;
		
		var currentParents = [];
		for (var i = keywordFound; i < lines.length; i++) {
			var line = lines[i].trim();
			level = 0;
			if (line !== "") {
			  
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
				var lineData = { text: line, level: level };

				if (level === 0) {
				  if (currentParents.length > 0) {
					currentParents[currentParents.length - 1].children =
					  currentParents[currentParents.length - 1].children || [];
					currentParents[currentParents.length - 1].children.push(lineData);
				  } else {
					data.push(lineData);
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
					data.push(lineData);
				  }

				  currentParents.push(lineData);
				}
			}
		}
		console.log(data);
        $("#output").jstree({
          core: {
            data: data,
          },
        });
      })
      .catch(function (error) {
        console.error('Error extracting text:', error);
        $("#output").html("Error reading file.");
      });
  };

  reader.readAsArrayBuffer(file);
}

function readDiemChuan() {
	var excelFileName = 'DiemChuan.xlsx';

	$.ajax({
		url: excelFileName,
		method: 'GET',
		xhrFields: {
			responseType: 'arraybuffer'
		},
		success: function (data) {
			var dataUint8 = new Uint8Array(data); // Convert data to Uint8Array
			var workbook = XLSX.read(dataUint8, { type: 'array' });
			var sheetName = workbook.SheetNames[0];
			var sheet = workbook.Sheets[sheetName];

			var excelArray = XLSX.utils.sheet_to_json(sheet, { header: 1 });
			console.log(excelArray);
		},
		error: function (xhr, status, error) {
			console.error('Error loading the Excel file:', error);
		}
	});
}
$(document).ready(function () {
	$("#fileInput").change(function () {
	  var file = this.files[0];
	  readFile(file); // Trigger the function when a file is uploaded
	});

	$("#readButton").click(function () {
		 readFile($("#fileInput")[0].files[0]);
	});
	
	$("#Export").click(function () {
		// var treeData = $('#output').jstree(true).get_json('#', { flat: true });
		// console.log(treeData);
		readDiemChuan();
	});


	var inputArray = ["TIÊU CHUẨN", "Mục ", "Phần "]; // Array to store the input elements

  // Loop through each input element
  $("input[type='text']").each(function(index) {
    $(this).val(inputArray[index]); // Set the value of the current input element
  });
});