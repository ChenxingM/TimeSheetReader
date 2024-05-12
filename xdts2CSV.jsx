if (typeof JSON !== "object") {
    JSON = {};
}
(function () {
    "use strict";

    var rx_one = /^[\],:{}\s]*$/;
    var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
    var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
        // Format integers to have at least two digits.
        return (n < 10)
            ? "0" + n
            : n;
    }

    function this_value() {
        return this.valueOf();
    }

    if (typeof Date.prototype.toJSON !== "function") {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? (
                    this.getUTCFullYear()
                    + "-"
                    + f(this.getUTCMonth() + 1)
                    + "-"
                    + f(this.getUTCDate())
                    + "T"
                    + f(this.getUTCHours())
                    + ":"
                    + f(this.getUTCMinutes())
                    + ":"
                    + f(this.getUTCSeconds())
                    + "Z"
                )
                : null;
        };

        Boolean.prototype.toJSON = this_value;
        Number.prototype.toJSON = this_value;
        String.prototype.toJSON = this_value;
    }

    var gap;
    var indent;
    var meta;
    var rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string)
            ? "\"" + string.replace(rx_escapable, function (a) {
                var c = meta[a];
                return typeof c === "string"
                    ? c
                    : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
            }) + "\""
            : "\"" + string + "\"";
    }


// This variable is initialized with an empty array every time
// JSON.stringify() is invoked and checked by the str() function. It's
// used to keep references to object structures and capture cyclic
// objects. Every new object is checked for its existence in this
// array. If it's found it means the JSON object is cyclic and we have
// to stop execution and throw a TypeError accordingly the ECMA262
// (see NOTE 1 by the link https://tc39.es/ecma262/#sec-json.stringify).

    var seen;

// Emulate [].includes(). It's actual for old-fashioned JScript.

    function includes(array, value) {
        var i;
        for (i = 0; i < array.length; i += 1) {
            if (value === array[i]) {
                return true;
            }
        }
        return false;
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i;          // The loop counter.
        var k;          // The member key.
        var v;          // The member value.
        var length;
        var mind = gap;
        var partial;
        var value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (
            value
            && typeof value === "object"
            && typeof value.toJSON === "function"
        ) {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case "string":
            return quote(value);

        case "number":

// JSON numbers must be finite. Encode non-finite numbers as null.

            return (isFinite(value))
                ? String(value)
                : "null";

        case "boolean":
        case "null":

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce "null". The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is "object", we might be dealing with an object or an array or
// null.

        case "object":

// Due to a specification blunder in ECMAScript, typeof null is "object",
// so watch out for that case.

            if (!value) {
                return "null";
            }

// Check the value is not circular object. Otherwise throw TypeError.

            if (includes(seen, value)) {
                throw new TypeError("Converting circular structure to JSON");
            }

// Keep the value for the further check on circular references.

            seen.push(value);

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === "[object Array]") {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? "[]"
                    : gap
                        ? (
                            "[\n"
                            + gap
                            + partial.join(",\n" + gap)
                            + "\n"
                            + mind
                            + "]"
                        )
                        : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === "string") {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                (gap)
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                (gap)
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? "{}"
                : gap
                    ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
                    : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== "function") {
        meta = {    // table of character substitutions
            "\b": "\\b",
            "\t": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            "\"": "\\\"",
            "\\": "\\\\"
        };
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = "";
            indent = "";

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === "string") {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== "function" && (
                typeof replacer !== "object"
                || typeof replacer.length !== "number"
            )) {
                throw new Error("JSON.stringify");
            }

// Initialize the reference keeper.

            seen = [];

// Make a fake root object containing our value under the key of "".
// Return the result of stringifying the value.

            return str("", {"": value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== "function") {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k;
                var v;
                var value = holder[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            rx_dangerous.lastIndex = 0;
            if (rx_dangerous.test(text)) {
                text = text.replace(rx_dangerous, function (a) {
                    return (
                        "\\u"
                        + ("0000" + a.charCodeAt(0).toString(16)).slice(-4)
                    );
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with "()" and "new"
// because they can cause invocation, and "=" because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with "@" (a non-JSON character). Second, we
// replace all simple value tokens with "]" characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or "]" or
// "," or ":" or "{" or "}". If that is so, then the text is safe for eval.

            if (
                rx_one.test(
                    text
                        .replace(rx_two, "@")
                        .replace(rx_three, "]")
                        .replace(rx_four, "")
                )
            ) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The "{" operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval("(" + text + ")");

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return (typeof reviver === "function")
                    ? walk({"": j}, "")
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError("JSON.parse");
        };
    }
}());

// 创建UI
var win = new Window("palette", "Time Sheet Reader", undefined);
win.orientation = "column";

var openButton = win.add("button", undefined, "Open TimeSheet File");
var ts = win.add("statictext", undefined, undefined, {name: "TimeSheet File:"}); 
    ts.text = "TimeSheet File:"; 
var textArea = win.add("edittext", undefined, "", { multiline: true });
    textArea.size = [300, 250];
var ts = win.add("statictext", undefined, undefined, {name: "Debug Info:"}); 
    ts.text = "Debug Info:"; 
var debugtxt = win.add("edittext", undefined, "", { multiline: true });
debugtxt.size = [300, 200];

// 打开文件并处理
openButton.onClick = function() {

    var timeSheetFile = File.openDialog("选择sxf/csv/xdts文件", "*.sxf,*.csv,*.xdts");
if (timeSheetFile != null) {
    var fileExtension = timeSheetFile.name.split('.').pop().toLowerCase();

    if (fileExtension === "sxf") {
        // 处理sxf文件
        timeSheetFile = sfx2CSV(timeSheetFile);
        textArea.text = timeSheetFile.toString();
        debugtxt.text = "sxf";
    } else if (fileExtension === "xdts") {
        // 处理xdts文件
        timeSheetFile.encoding = 'UTF8';
        timeSheetFile.open('r');
        var content = timeSheetFile.read();
        timeSheetFile.close();

        var jsonData = parseXDTS(content);
        textArea.text = xdts2CSV(jsonData);
        debugtxt.text += "xdts\n\n" + JSON.stringify(jsonData);
    } else if (fileExtension === "csv") {
        // 处理csv文件
        function readCSVData(CSVFile) {
            var CSVData = [];
            if (CSVFile !== null) {
                CSVFile.open("r");
        
                while (!CSVFile.eof) {
                    var currentLine = CSVFile.readln();
                    CSVData.push(currentLine.split(","));
                }
        
                CSVFile.close();
            }
            return CSVData;
        }
        var CSVData = readCSVData(timeSheetFile);
        var rrr = new RegExp('"', "g");
        if (CSVData.length > 0) {
            // 将CSV数据添加到文本区域
            var text = "";
            for (var i = 0; i < CSVData.length; i++) {
                text += CSVData[i].join("\t") + "\n";
            }
            var data = text.replace(rrr,"");
            textArea.text = data;
        } else {
            $.writeln("未选择文件或文件为空");
        }
        debugtxt.text = "csv";
    }
} else {
    alert("未选择文件");
}

}


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

function parseXDTS(content) {
    var lines = content.split('\n');

    var trimmedFirstLine = lines[0].replace(/^\s+|\s+$/g, '');
    if (trimmedFirstLine === "exchangeDigitalTimeSheet Save Data") {
        try {
            var jsonPart = lines.slice(1).join('\n');
            var jsonData = JSON.parse(jsonPart);

            return jsonData;
        } catch (e) {
            alert("解析xdts时出错: " + e.toString());
            return null;
        }
    } else {
        alert("非法的xdts文件");
        return null;
    }
}

function xdts2CSV(json_data) {
    debugtxt.text = "时长" + JSON.stringify(json_data.timeTables[0].duration) + "\n";
    var maxTracks = 0;
    for (var i = 0; i < json_data.timeTables.length; i++) {
        for (var j = 0; j < json_data.timeTables[i].fields.length; j++) {
            maxTracks = Math.max(maxTracks, json_data.timeTables[i].fields[j].tracks.length);
        }
    }
   
    var csvString = '"Frame",';
    var trackNames = json_data.timeTables[0].timeTableHeaders[0].names;

    var keyAnimationCount = 0;  // 原画轨道的数量
    var inbetweenCount = 0;     // 动画轨道的数量
    
    for (var i = 0; i < json_data.timeTables[0].fields.length; i++) {
        var lm;
        if(json_data.timeTables[0].fields[i].fieldId == 0) lm = "セル";
        if(json_data.timeTables[0].fields[i].fieldId == 3) lm = "台词";
        if(json_data.timeTables[0].fields[i].fieldId == 5) lm = "摄像机";
        debugtxt.text += "fieldId: " + json_data.timeTables[0].fields[i].fieldId + " " + lm + "\n";
        for (var j = 0; j < json_data.timeTables[0].fields[i].tracks.length; j++) {
            var track = json_data.timeTables[0].fields[i].tracks[j];
            var isKeyAnimationTrack = false;
    
            for (var k = 0; k < track.frames.length; k++) {
                var frame = track.frames[k];
                var value = frame.data[0].values[0];
    
                // 检查是否为 SYMBOL_TICK_1 或 SYMBOL_TICK_2
                if (value === "SYMBOL_TICK_1" || value === "SYMBOL_TICK_2") {
                    isKeyAnimationTrack = true;
                    break;  // 如果找到了，就不需要检查更多的 frame
                }
            }
    
            if (isKeyAnimationTrack) {
                keyAnimationCount++;
            } else {
                inbetweenCount++;
            }
        }
    }
    debugtxt.text += "\n原画轨道数量 " + keyAnimationCount;
    debugtxt.text += "\n动画轨道数量 " + inbetweenCount;

    // 添加原画和动画列
    if (keyAnimationCount > 0) {
        csvString += '"原画",';
        for (var i = 1; i < keyAnimationCount; i++) {
            csvString += '"",';
        }
    }
    if (inbetweenCount > 0) {
        csvString += '"动画",';
        for (var i = 1; i < inbetweenCount; i++) {
            csvString += '"",';
        }
    }
    csvString += '\n';

    // 添加图层名称
    var layerNameLine = '""';
    for (var i = 0; i < trackNames.length; i++) {
        layerNameLine += ',"' + trackNames[i] + '"';
    }
    for (var i = trackNames.length; i < maxTracks; i++) {
        layerNameLine += ',""';
    }

    csvString += layerNameLine + '\n';

    //中割标记转换
    function getSymbolForValue(value) {
        var symbols = {
            "SYMBOL_TICK_1": '"○"',
            "SYMBOL_TICK_2": '"●"',
            "SYMBOL_NULL_CELL": '"×"'
        };
        return symbols[value] ? symbols[value] : ('"' + value + '"');
    }
    
    function getSymbolForFrame(track, frameNumber) {
        for (var k = 0; k < track.frames.length; k++) {
            var frame = track.frames[k];
            if (frame.frame === frameNumber - 1 && frame.data[0].values.length > 0) {
                return getSymbolForValue(frame.data[0].values[0]);
            }
        }
        return '""';
    }
    
    // 添加帧数据
    for (var frameNum = 1; frameNum <= json_data.timeTables[0].duration; frameNum++) {
        var rowData = '"' + frameNum + '"';
        var timeTable = json_data.timeTables[0];
        for (var trackIndex = 0; trackIndex < maxTracks; trackIndex++) {
            var symbol = '""';
            for (var j = 0; j < timeTable.fields.length; j++) {
                var field = timeTable.fields[j];
                if (trackIndex < field.tracks.length) {
                    symbol = getSymbolForFrame(field.tracks[trackIndex], frameNum);
                    break;
                }
            }
            rowData += ',' + symbol;
        }
        csvString += rowData + ',\n';
    }    

    return csvString;
}


win.show();
