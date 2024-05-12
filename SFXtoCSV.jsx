
// 创建UI
var win = new Window("palette", "SXF to CSV Converter", undefined);
win.orientation = "column";

var openButton = win.add("button", undefined, "Open SXF File");
var textArea = win.add("edittext", undefined, "", {multiline: true});
textArea.size = [300, 250];

// 打开文件并处理
openButton.onClick = function() {
    var sxfFile = File.openDialog("Select a SXF file");
    if (sxfFile != null) {
        var csvContent = sfx2CSV(sxfFile);
        textArea.text = csvContent;
        csvContent.close();
    }
};

function sfx2CSV(file) {
    // 设置文件编码并打开文件
    file.encoding = "BINARY";
    if (!file.open("r")) {
        throw new Error("Failed to open file: " + file.fsName);
    }

    // 读取文件内容并按行分割
    var content = file.read();
    var arr = content.split("\n");
    file.close();

    // 初始化处理过程中的变量
    var next = false;
    var cellArray = [];
    var frameArray = [];
    const cellRegex = /([#○●]|%0[12456789])([A-Z]+[^#~○●×%]*)~~~#~~~/i;
    const cellRegex2 = /([#○●]|%0[12456789])([A-Z]+[^#~○●×%]*)~~~~~~/i;

    // 循环处理每一行数据
    for (var i = 0, len = arr.length; i < len; ++i) {
        var line = parseURI(encodeURI(arr[i]));
        var cell = cellRegex.exec(line) || cellRegex2.exec(line);
        var frame = [];

        // 提取和处理帧数据
        if (next) {
            var end = false;
            var endId = cell ? line.indexOf(cell[0]) : line.length;
            for (var f = 1; f < endId; f += 10) {
                var slice = line.substr(f, 10).replace("BG", "1");
                if (slice.match(/[A-Z]/g)) {
                    end = true;
                } else if (!end) {
                    var num = slice.split("~")[0].replace(/[^\d○●×]/g, "");
                    frame.push(num ? num : "");
                }
            }
            if (frame.length) frameArray.push(frame);
        }
        next = !!cell;
        if (cell) cellArray.push(cell[2]);
    }

    var csvString = '';
    var temp1 = "", temp2 = "";
    var cellLen = cellArray.length;

    // 构建列头
    for (var i = 0; i < cellLen / 2; i++) {
        temp1 += ',""';  // 对于每个图层，添加两个空列
        temp2 += ',"' + cellArray[i] + '"';
    }
    csvString += '"Frame","原画"' + temp1 + ',"台词","动画"' + temp1 + "\n";
    csvString += '""' + temp2 + ',""' + temp2 + "\n";

    // 构建每一帧的数据
    for (var i = 1; i <= frameArray[0].length; i++) {
        var frame = '"' + i + '"';
        for (var j = 0; j < cellLen; j++) {
            var frameData = (frameArray[j] && frameArray[j][i - 1]) ? frameArray[j][i - 1] : "";
            frame += ',"' + frameData + '"';
        }
        csvString += frame + "\n";
    }

    return csvString;
}

function parseURI(uri) {
    return uri.replace(/%01/g, "#").replace(/%00/g, "~").replace(/%02/g, "○").replace(/%04/g, "●").replace(/%08/g, "×").replace(/%20/g, "");
}

win.show();
