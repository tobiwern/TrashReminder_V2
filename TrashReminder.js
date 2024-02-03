//setInterval(function(){getData();}, 2000);
function require(script) {
    $.ajax({
        url: script,
        dataType: "script",
        async: false,           // <-- This is the key
        success: function () {
            // all good...
        },
        error: function () {
            throw new Error("Could not load script " + script);
        }
    });
}
//require("./colorPicker/colorPick.js");
var gMaxNumberOfEpochs;
var gMaxNumberOfTasksPerDay;
var gMaxNumberOfTaskIds;
var gHideDelayDefault = 3;

function acknowledge() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            showMessage("I", "Mülleimer steht draussen bestätigt!", "messageAcknowledge", gHideDelayDefault);
            document.getElementById("buttonAcknowledge").innerHTML ="<button class='button' onclick='restartTrashReminder()'>Mülleimer steht doch nicht draussen!</button><br><br>"
            gAcknowledge = true;
        }
    };
    xhttp.open("GET", "acknowledge", true);
    xhttp.send();
}

function fireworks() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            showMessage("I", "FEUERWERK!", "buttonMessage", gHideDelayDefault);
        }
    };
    xhttp.open("GET", "fireworks", true);
    xhttp.send();
}

function toggleDemo() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            if(this.responseText == "DemoOn"){
                showMessage("I", "Demo Mode gestartet!" , "buttonMessage", gHideDelayDefault);
                document.getElementById("demoButton").innerHTML = "Demo Mode beenden";
            } else {
                showMessage("I", "Demo Mode beendet!" , "buttonMessage", gHideDelayDefault);
                document.getElementById("demoButton").innerHTML = "Demo Mode starten";
            }
        }
    };
    xhttp.open("GET", "toggle_demo", true);
    xhttp.send();
//    document.getElementById("body").innerHTML = "<h1>Demo Mode!</h1>";
//    window.scrollTo(0, 0);
}

function addFavicon() {
    document.title = "Trash Reminder"
    $favicon = document.createElement("link")
    $favicon.rel = "icon"
    $favicon.type = "image/png"
    $favicon.href = "https://tobiwern.github.io/TrashReminder_V2/favicon.ico"
    document.head.appendChild($favicon)
    $shortcut = document.createElement("link")
    $shortcut.rel = "apple-touch-icon"
    $shortcut.href = "https://tobiwern.github.io/TrashReminder_V2/shortcut.png"
    $shortcut.sizes = "152x152"
    document.head.appendChild($shortcut)
    $shortcut1 = document.createElement("link")
    $shortcut1.rel = "shortcut icon"
    $shortcut1.type = "image/x-icon"
    $shortcut1.href = "https://tobiwern.github.io/TrashReminder_V2/shortcut.png"
    $shortcut1.sizes = "152x152"
    document.head.appendChild($shortcut1)
    $shortcut2 = document.createElement("link")
    $shortcut2.rel = "mask-icon"
    $shortcut2.color = "#1599ff"
    $shortcut2.href = "https://tobiwern.github.io/TrashReminder_V2/shortcut.svg"
    document.head.appendChild($shortcut2)
}

function restartTrashReminder() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            showMessage("I", "TrashReminder wurde neu gestartet!", "buttonMessage", gHideDelayDefault);
            if(gAlarm){document.getElementById("buttonAcknowledge").innerHTML ="<button class='button' onclick='acknowledge()'>Mülleimer steht draussen!</button><br><br>"}
            gAcknowledge = false;
            refreshTaskDates();
        }
    };
    xhttp.open("GET", "close", true);
    xhttp.send();
}

function closeConfig() {
    restartTrashReminder();
    document.getElementById("body").innerHTML = "<h1>Beendet - Bitte Fenster schließen!</h1>";
    window.scrollTo(0, 0);
    //  window.close(); //close the page
}

function requestLogFromESP() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            showMessage("I", this.responseText.replaceAll("\n", "<br>"), "buttonMessage"); //show continuous
        }
    };
    xhttp.open("GET", "request_log", true);
    xhttp.send();
}

function deleteLogOnESP() {
    const response = confirm("Wollen Sie wirklich das Logfile löschen?");
    if (!response) {
        showMessage("I", "Löschen des Logfiles abgebrochen.", "buttonMessage", gHideDelayDefault);
        return;
    }
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
                showMessage("I", "Logfile gelöscht.", "buttonMessage", gHideDelayDefault);   
            } else { //500
                showMessage("W", "Löschen des Logfiles fehlgeschlagen!", "buttonMessage", gHideDelayDefault); 
            }      
        }
    };
    xhttp.open("GET", "delete_log", true);
    xhttp.send();
}

function requestSettingsFromESP() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            //populate options
            const dropdowns = ["start", "end"];
            dropdowns.forEach(function (item) {
                for (var i = 0; i <= 23; i++) {
                    var el = document.createElement("option");
                    el.textContent = i + " Uhr";
                    el.value = i;
                    document.getElementById(item).appendChild(el);
                }
            });
            value = this.responseText;
            tokens = value.split(",");
            document.getElementById("start").value = tokens[0];
            document.getElementById("end").value = tokens[1];
            // document.addEventListener('DOMContentLoaded', function () {
            //     enableEventListener('start');
            //     enableEventListener('end');
            // });
            // function enableEventListener(dropdown) {
            //     document.getElementById(dropdown).addEventListener('change', function () { sendDropDownStateToESP(dropdown); });
            // }
            gMaxNumberOfEpochs = tokens[2];
            gMaxNumberOfTasksPerDay = tokens[3]; //tasks per day
            gMaxNumberOfTaskIds = tokens[4]; //different tasks
        }
    };
    xhttp.open("GET", "request_settings", true);
    xhttp.send();
}

function requestTasksFromESP(show = true) { //send the ESP data to the webpage
  var xhttp = new XMLHttpRequest();
  blockAction();
  xhttp.onreadystatechange = function () {
    allowAction();
    if (this.readyState == 4) {
      response = this.responseText;
      if (this.status == 200) {
        refreshTaskTypesAndDates(response);
      } else { //500
        showMessage("W", "Es sind noch keine Abholtermine auf der \"Müll-Erinnerung\" gespeichert!", "messageTaskTypes");
        if (show) { showMessage("E", "Lesen der Daten fehlgeschlagen!", "messageDeleteTasks", gHideDelayDefault); }
        document.getElementById("taskTypes").innerHTML = "";
        document.getElementById("download").click();
        gNoDates = true;
      }
//      refreshTabs();
    }
  };
  xhttp.open("GET", "request_tasks", true);
  xhttp.send();
}

function sendTasksToESP(jsonText, currentData = false) { //send the jsonText to the ESP to be stored in LittleFS
    if (currentData) {
        receiver = "messageTaskTypes";
        message = "Neue Auswahl gespeichert.";
        hideDelay = 2;
    } else {
        receiver = "messageDeleteTasks";
        message = "Übertragen der Daten war erfolgreich.";
        hideDelay = 5;
    }
    var xhttp = new XMLHttpRequest();
    blockAction();
    xhttp.onreadystatechange = function () {
      allowAction();
      if (this.readyState == 4) {
            if (this.status == 200) {
                showMessage("I", message, receiver, hideDelay);
//                requestTasksFromESP(); //if storing the values on the ESP was successful => refresh the "current values" on the webpage
            } else { //500
                showMessage("E", "ERROR: Übertragen der Daten fehlgeschlagen!", receiver, gHideDelayDefault);
            }
        }
    };
    xhttp.open("GET", "send_tasks?value=" + jsonText, true);
    xhttp.send();
}

function sendValidTaskTypesToESP() {
    const taskTypeCheckBoxes = document.getElementsByClassName("taskType");
    var validTaskIds = [];
    for (let i = 0; i < taskTypeCheckBoxes.length; i++) {
      checkBox = taskTypeCheckBoxes[i];
      if (checkBox.checked) {
        validTaskIds.push(i);
      }
    }
showMessage("W", "validTaskIds.length = " + validTaskIds.length, "messageTaskTypes");
    if (validTaskIds.length == 0) {
      showMessage("W", "Sie müssen mindestens eine Abfallart auswählen!", "messageTaskTypes");
      return;
    }
    gDataValidTaskIds = validTaskIds; //update in global Setup
    sendCurrentDataToESP(); //send updated data
}

function sendDropDownStateToESP(dropdown) {
    var value = parseInt(document.getElementById(dropdown).value);
    var xhttp = new XMLHttpRequest();
    blockAction();
    xhttp.onreadystatechange = function () {
      allowAction();
      if (this.readyState == 4 && this.status == 200) {
            response = this.responseText;
            showMessage("I", response, "messageTime", gHideDelayDefault);
        }
    };
    if (dropdown == "start") {
        var endValue = parseInt(document.getElementById("end").value)
        if (value < endValue) {
            var newValue = endValue + 1;
            alert("Um überlappende Ereignisse an Folgetagen zu vermeiden, sollte der \"Start der Erinnerung\" (" + value + ") nicht vor dem \"Ende der Erinnerung\" (" + endValue + ") liegen!\nSetze \"Start der Erinnerung\" auf minimal zulässigen Wert (" + newValue + ").");
            value = newValue
            document.getElementById(dropdown).value = value
        }
    } else {
        var startValue = parseInt(document.getElementById("start").value)
        if (startValue < value) {
            newValue = startValue - 1;
            alert("Um überlappende Ereignisse an Folgetagen zu vermeiden, sollte der \"Start der Erinnerung\" (" + startValue + ") nicht vor dem \"Ende der Erinnerung\" (" + value + ") liegen!\nSetze \"Ende der Erinnerung\" auf maximal zulässigen Wert (" + newValue + ").");
            value = newValue;
            document.getElementById(dropdown).value = value
        }
    }
    xhttp.open("GET", "set_" + dropdown + "?value=" + value, true);
    xhttp.send();
}

function deleteTasksOnESP() {
  const response = confirm("Wollen Sie wirklich alle Abfuhrtermine von der \"Müll-Erinnerung\" löschen?");
  if (!response) {
    showMessage("I", "Löschen der Daten abgebrochen.", "messageDeleteTasks", gHideDelayDefault);
    return;
  }
  var xhttp = new XMLHttpRequest();
  blockAction();
  xhttp.onreadystatechange = function () {
    allowAction();
    if (this.readyState == 4) {
      if (this.status == 200) {
        showMessage("I", "Löschen der Daten war erfolgreich!", "messageDeleteTasks", gHideDelayDefault);
        requestTasksFromESP(false); //if deleting the values on the ESP was successful => refresh the "current values" on the webpage
      } else { //500
        showMessage("E", "ERROR: Löschen der Daten fehlgeschlagen!", "messageDeleteTasks", gHideDelayDefault);
      }
    }
  };
  xhttp.open("GET", "delete_tasks", true);
  xhttp.send();
}

function resetWifiSettingsOnESP() {
    const response = confirm("Wollen Sie wirklich die WLAN Einstellungen löschen?");
    if (!response) {
        showMessage("I", "Löschen der WLAN Einstellungen abgebrochen.", "buttonMessage", gHideDelayDefault);
        return;
    }
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
                showMessage("I", "Löschen der WLAN Einstellungen war erfolgreich!", "buttonMessage", gHideDelayDefault);
                requestTasksFromESP(false); //if deleting the values on the ESP was successful => refresh the "current values" on the webpage
            } else { //500
                showMessage("E", "ERROR: Löschen der WLAN Einstellungen fehlgeschlagen!", "buttonMessage", gHideDelayDefault);
            }
        }
    };
    xhttp.open("GET", "reset_wifi_settings", true);
    xhttp.send();
    closeConfig();
}

/// WebPage Refresh Functions for CURRENT Data on ESP
//globally defined for form field callbacks
var gDataEpochTaskDict = {};
var gDataColors = [];
var gDataTasks = [];
var gDataValidTaskIds = [];
var gAlarm = false;
var gAcknowledge = false;
var gOptionShowPastDates = true;
var gNoDates = false;
var gFutureDates = 0;

function initDataFromJson(jsonObject) {
    var epochTasks = jsonObject["epochTasks"];
    for (const epochTask of epochTasks) {
        for (var epoch in epochTask) { //translate into dict
            gDataEpochTaskDict[epoch] = epochTask[epoch];
        }
    }
    gDataColors = jsonObject["colors"];
    gDataTasks = jsonObject["tasks"];
    gDataValidTaskIds = jsonObject["validTaskIds"];
}

function sendCurrentDataToESP() { //send currently set data to ESP
    var entries = [];
    var epochs = Object.keys(gDataEpochTaskDict);
    for (epoch of epochs) {
        taskIds = gDataEpochTaskDict[epoch];
        entries.push('{"' + epoch + '":[' + taskIds.join(',') + ']}');
    }
    var jsonText = '{"tasks":["' + gDataTasks.join('","') + '"],"colors":["' + gDataColors.join('","') + '"],"validTaskIds":[' + gDataValidTaskIds.join(',') + '],"epochTasks":[' + entries.join(',') + ']}';
    console.log(jsonText);
    try {
        const obj = JSON.parse(jsonText); //just to check if valid JSON, ToDo: Show if there is an error!
        sendTasksToESP(jsonText, true);
    } catch (e) {
        showMessage("E", "<em>Die Daten sind nicht korrekt als JSON formatiert. Bitte öffnen Sie ein <a href='https://github.com/tobiwern/TrashReminder_V2/issues' target='_blank'>GitHub Issue</a></em>", "messageDeleteTasks");
        return;
    }
}

function refreshTaskTypesAndDates(response) {
    //    const jsonObject = JSON.parse(response);
    try {
        const jsonObject = JSON.parse(response);
        document.getElementById("taskDates").style.color = "black";
        document.getElementById("messageTaskTypes").innerHTML = "";
        gDataEpochTaskDict = {}; //reset
        initDataFromJson(jsonObject);
        refreshTaskTypes();
        refreshTaskDates();
        refreshTabs();
        if(gAlarm){document.getElementById("buttonAcknowledge").innerHTML ="<button class='button' onclick='acknowledge()'>Mülleimer steht draussen!</button><br><br>"}
    } catch (e) {
        showMessage("E", "Die Daten sind nicht korrekt als JSON formatiert. Bitte öffnen Sie ein <a href='https://github.com/tobiwern/TrashReminder_V2/issues' target='_blank'>GitHub Issue</a>.<br>ERROR: " + e, "messageTaskTypes");
        document.getElementById("taskDates").innerHTML = response;
        return;
    }
}

function refreshTaskTypes() {
    var text = "Sie werden an folgende Abfallarten erinnert:<br><br>";
    text += "<table>";
    for (let i = 0; i < gDataTasks.length; i++) {
        checked = (gDataValidTaskIds.length == 0 || gDataValidTaskIds.includes(i)) ? "checked" : "";
        text += "<tr>"
        text += "<td class='value'><div><input type='checkbox' class='taskType' onChange='refreshTaskDates();sendValidTaskTypesToESP();' id='taskType" + i + "' name=task" + i + "' " + checked + ">";
        text += "<label for='taskType" + i + "' id='taskTypel" + i + "'> " + gDataTasks[i] + "</label><div></td>";
        text += "<td><div class='colorPickSelector' id='colorPickerTask" + i + "'></div></td>";
        text += "</tr>";
    }
    text += "</table>";
    text += "<br><em>Setzen Sie einen Haken für die Abfallarten an die Sie erinnert werden wollen. Sie können die Farbe des Warnlichts durch klicken auf das Farbkästchen auswählen.<br></em>"
    document.getElementById("taskTypes").innerHTML = text + "<br>";
    refreshColorPickerColors("colorPickerTask");
}

function refreshTaskDates() { //show TaskDates on Webpage 
  var text = "";
  text += "<div id='futureDates'></div>";
  var epochs = Object.keys(gDataEpochTaskDict).sort();
  text += "<table id=epochTasks>"
  text += "<tr><th>Datum der Abholung</th><th>Müllart</th></tr>"
  const taskTypeCheckBoxes = document.getElementsByClassName("taskType");
  taskIdEnableValue = [];
  for (checkBox of taskTypeCheckBoxes) {
    taskIdEnableValue.push(checkBox.checked);
  }
  var nowEpoch = Date.now();
  var startHour = parseInt(document.getElementById("start").value);
  var endHour = parseInt(document.getElementById("end").value);
  gAlarm = false;
  gFutureDates = 0;
  gNoDates = true;
  for (const epoch of epochs) {  //epoch in seconds
    gNoDates = false;
    var dictEpoch = new Date(epoch * 1000); //Date uses miliseconds
    var taskIds = gDataEpochTaskDict[epoch];
    selectedTaskIds = [];
    for (const taskId of taskIds) {
      if (taskIdEnableValue[taskId]) {
        selectedTaskIds.push(taskId);
      }
    }
    var show = true;
    futureDate = false;
    if (dictEpoch.valueOf()+endHour*60*60*1000 > nowEpoch) { style = "color: black;"; futureDate=true;} else { style = "color: lightgrey;"; show = gOptionShowPastDates;} 
    if (nowEpoch > dictEpoch.valueOf()+(startHour-24)*60*60*1000  && nowEpoch < dictEpoch.valueOf()+endHour*60*60*1000) { gAlarm = true; style = "color: #4CAF50; font-weight: bold;"; if(!gAcknowledge){style += " animation: blinker 1s linear infinite;"; }}
    if ((selectedTaskIds.length >= 1) && show) {
      if(futureDate){gFutureDates++;}
      text += "<tr>"
      text += "<td class=description nowrap style='" + style + "'>" + epochToDateString(epoch) + "</td>";
      text += "<td style='" + style + "'>";
      for (const taskId of selectedTaskIds) {
        text += "<div class=taskType><div style='background-color: " + gDataColors[taskId].replace("0x", "#") + ";border: 2px solid grey;padding: 10px 10px;display: inline-block;'></div>";
        text += " " + gDataTasks[taskId] + "</div>";
      }
      text += "</td>";
      text += "</tr>";
    }
  }
  text += "</table>";
  document.getElementById("taskDates").innerHTML = text;
  document.getElementById("futureDates").innerHTML = gFutureDates + " Abholtermine stehen noch an.<br><br>";
}

/// ICS/iCAL Processing ////////////////////////////////////////////////////////////////////
var gDebug = false;
var gTasks = [];
var gEpochTaskDict = {};                       //HÄCKSEL
var gColorDict = { 'PAPIER': '0x0000FF', 'BIO,CKSEL': '0x00FF00', 'GELB,WERT': '0xFFFF00', 'REST': '0xFFFFFF' }
var gColorDefault = '0xFFC0CB';
var gColors = []
function processFiles() {
    gTasks = [];
    gEpochTaskDict = {};
    var files = document.getElementById('files').files;
    for (var fileIndex = 0; fileIndex < files.length; fileIndex++) {
        var file = files[fileIndex];
        var reader = new FileReader();
        reader.onload = function (progressEvent) {
            const text = this.result; //entire file
            var lines = text.split('\n');
            for (const line of lines) {
                if (line.search("DTSTART") != -1) {
                    var date = line.split(":")[1];
                    dateString = date.substring(0, 4) + "-" + date.substring(4, 6) + "-" + date.substring(6, 8);
                    var epoch = new Date(dateString).getTime() / 1000; //since ms => s
                } else if (line.search("SUMMARY") != -1) {
                    var task = line.split(":")[1];
                    task = task.replace("\\", "");
                    task = task.replace("\r", "");
                } else if (line.search("END:VEVENT") != -1) {
                    if (!(epoch in gEpochTaskDict)) { gEpochTaskDict[epoch] = { "tasks": [], "date": dateString }; }
                    var arr = gEpochTaskDict[epoch]["tasks"];
                    arr.push(task);
                    gEpochTaskDict[epoch][tasks] = arr;
                    if (!gTasks.includes(task)) {
                        gTasks.push(task);
                        gColors = getColors();
                    }
                }
            }
            showCheckBoxes(gTasks); //executed multiple times per loaded file, however ok
            checkMaxNumberOfEntries();
        }; //on load
        reader.readAsText(file);
    }
}

function getValidTaskIds() {
    var validTaskIds = [];
    for (var i = 0; i < gTasks.length; i++) {
        var label = document.getElementById("taskl" + i).innerText;
        if (document.getElementById("task" + i).checked) {
            validTaskIds.push(i);
        }
    }
    return (validTaskIds);
}

function getTaskIds(tasks) {
    var taskIds = [];
    for (var i = 0; i < tasks.length; i++) {
        taskIds.push(gTasks.indexOf(tasks[i]));
    }
    return (taskIds);
}

function getColors() {
    var colors = [];
    for (const task of gTasks) {
        var color = getMatchingColor(task);
        if (color) {
            colors.push(color);
        } else {
            alert("Failed to auto-assign color for entry " + task + ".<br>Assigning default color (pink).");
            colors.push(gColorDefault);
        }
    }
    return (colors);
}

function getMatchingColor(task) {
    var keys = Object.keys(gColorDict).sort();
    for (const key of keys) {
        var entries = key.split(",");
        for (entry of entries) {
            if (task.toUpperCase().search(entry) != -1) {
                return (gColorDict[key]);
            }
        }
    }
    return (false);
}

function genJson() {
    validTaskIds = getValidTaskIds();
    console.log(validTaskIds);
    var entries = [];
    var epochs = Object.keys(gEpochTaskDict);
    for (epoch of epochs) {
      var tasks = gEpochTaskDict[epoch]["tasks"];
      var taskIds = getTaskIds(tasks);
      var date = gEpochTaskDict[epoch]["date"];
      if (gDebug) {
        entries.push('{"' + epoch + '"' + ":" + '{"date":"' + date + '","tasks":["' + tasks.join('","') + '"],"taskIds":[' + taskIds.join(',') + ']}}');
      } else {
        entries.push('{"' + epoch + '":[' + taskIds.join(',') + ']}');
      }
    }

    var jsonText = '{"tasks":["' + gTasks.join('","') + '"],"colors":["' + gColors.join('","') + '"],"validTaskIds":[' + validTaskIds.join(',') + '],"epochTasks":[' + entries.join(',') + ']}';
    console.log(jsonText);
    try {
      const obj = JSON.parse(jsonText); //just to check if valid JSON, ToDo: Show if there is an error!
    } catch (e) {
      showMessage("E", "Die Daten sind nicht korrekt als JSON formatiert. Bitte öffnen Sie ein <a href='https://github.com/tobiwern/TrashReminder_V2/issues' target='_blank'>GitHub Issue</a>", "messageDeleteTasks");
      return;
    }
    sendTasksToESP(jsonText);
}

function checkMaxNumberOfEntries() {
    var text = "";
    if (gTasks.length > gMaxNumberOfTaskIds) {
        text += "Anzahl der Abfallarten ist " + gTasks.length + ". Es werden maximal " + gMaxNumberOfTaskIds + " <b>unterschiedliche Abfallarten</b> unterstützt!<br>";
    }
    var epochs = Object.keys(gEpochTaskDict);
    if (epochs.length > gMaxNumberOfEpochs) {
        text += "Anzahl der Abholtermine ist " + epochs.length + ". Es werden maximal " + gMaxNumberOfEpochs + " <b>Abholtermine</b> unterstützt!<br>";
    }
    for (const epoch of epochs) {
        var tasks = gEpochTaskDict[epoch]["tasks"];
        var taskIds = getTaskIds(tasks);
        if (taskIds.length > gMaxNumberOfTasksPerDay) {
            text += "Anzahl der Abfallarten pro Tag am " + epochToDateString(epoch, "short") + " ist " + taskIds.length + ". Es werden maximal " + gMaxNumberOfTasksPerDay + " unterschiedliche <b>Abfallarten pro Tag</b> unterstützt!<br>";
        }
    }
    if (text != "") {
        text += "Die darüber hinausgehenden Einträge werden nicht verarbeitet.<br>Bitte öffnen Sie ein <a href='https://github.com/tobiwern/TrashReminder_V2/issues' target='_blank'>GitHub Issue</a>!";
        showMessage("W", text, "messageDeleteTasks");
    }
}

function showCheckBoxes(items) {
    var i = 0;
    var text = "<i>Es wurden " + Object.keys(gEpochTaskDict).length + " Abholtermine in ";
    if (document.getElementById('files').files.length > 1) {
        text += "den Dateien gefunden.</i>";
    } else {
        text += "der Datei gefunden.</i>";
    }
    text += "<br><br>";
    text += "Bitte w&auml;hlen Sie die Abfallarten aus,<br>an die Sie erinnert werden wollen:<br><br>";
    text += genCheckBoxes(items, gColors);
    text += "<br><button class=button onclick='genJson()'>Abfuhrtermine speichern</button><br><br>";
    document.getElementById("tasks").innerHTML = text;
    refreshColorPickerColors("colorPickerIcs");
    document.getElementById("messageDeleteTasks").innerHTML = "";
}

function genCheckBoxes(tasks, colors, validTaskIds = []) {
    var text = "<table>";
    for (let i = 0; i < tasks.length; i++) {
        checked = (validTaskIds.length == 0 || validTaskIds.includes(i)) ? "checked" : "";
        text += "<tr>"
        text += "<td class=value><div><input type='checkbox' id='task" + i + "' name=task" + i + "' " + checked + ">";
        text += "<label for='task" + i + "' id='taskl" + i + "'> " + tasks[i] + "</label><div></td>";
        text += "<td><div class='colorPickSelector' id='colorPickerIcs" + i + "'></div></td>";
        //        text += "<td><div style='background-color: " + colors[i].replace("0x", "#") + ";border: 2px solid grey;padding: 10px 10px;display: inline-block;'></div></td>";
        text += "</tr>";
    }
    text += "</table>";
    return (text);
}

function send(number) {//debug
    showMessage("E", "Die Daten sind nicht korrekt als JSON formatiert. Bitte öffnen Sie ein GitHub Issue unter <a href='https://github.com/tobiwern/TrashReminder_V2/issues' target='_blank'>https://github.com/tobiwern/TrashReminder/issues</a>", "messageDeleteTasks");
}

/// ColorPicker          green      blue       yellow     white      orange     pink       purple    iceblue    icegreen
var colorPickPalette = ["#00ff00", "#0000ff", "#ffff00", "#ffffff", "#ba4500", "#d5002d", "#82007e", "#5a00a6", "#00ba45"]

function refreshColorPickers() {
    $(".colorPickSelector").colorPick({
        'initialColor': '',
        'palette': colorPickPalette,
        'onColorSelected': function () {
            this.element.css({ 'backgroundColor': this.color, 'color': this.color });
            var id = this.element.attr("id");
            var index = id.match(/(\d+)/)[0]; //get the number from the string (since ID name is different)
            if (id.search("colorPickerTask") != -1) {
                gDataColors[index] = this.color.replace("#", "0x");
                refreshTaskDates();
                sendCurrentDataToESP();
            } else {
                gColors[index] = this.color.replace("#", "0x");
            }
        }
    });
}

$(document).ready(function () {
    refreshColorPickers();
});

function refreshColorPickerColors(idName) {
    refreshColorPickers();
    var color;
    var colorPickers = document.getElementsByClassName('colorPickSelector');
    for (var i = 0; i < colorPickers.length; i++) {
        if (idName == "colorPickerTask") {
            color = gDataColors[i];
        } else {
            color = gColors[i];
        }
        if (color) { $("#" + idName + i).css("background", color.replace("0x", "#")); }
    }
}

/// Utility Functions
function epochToDateString(epoch, dateType = "long") {
    var dictEpoch = new Date(epoch * 1000);
    var timeStamp = "";
    if (dateType == "long") {
        timeStamp += dictEpoch.toLocaleString("de", { weekday: "long" }) + ", ";
    }
    timeStamp += ("00" + dictEpoch.getDate()).slice(-2) + "." + ("00" + dictEpoch.toLocaleString("de", { month: "numeric" })).slice(-2) + "." + dictEpoch.getFullYear();
    return (timeStamp);
}

let timeoutID;
function showMessage(msgType, message, receiver = "buttonMessage", hideDelayInSec = 0) {
    document.getElementById(receiver).innerHTML = message + "<br><br>";
    switch (msgType) {
        case "D":
            document.getElementById(receiver).style.color = "orange";
            break;
        case "W":
            document.getElementById(receiver).style.color = "orange";
            break;
        case "E":
            document.getElementById(receiver).style.color = "red";
            break;
        case "I":
            document.getElementById(receiver).style.color = "green";
            break;
        default:
            document.getElementById(receiver).style.color = "black";
    }
    if (hideDelayInSec != 0) {
        timeoutId = setTimeout(function () { document.getElementById(receiver).innerHTML = ""; }, hideDelayInSec * 1000);
    } else {
        clearTimeout(timeoutID);
    }
    if(receiver == "buttonMessage"){window.scrollTo(0, document.body.scrollHeight);}
}

function openPage(pageName,elmnt,color) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].style.backgroundColor = "";
  }
  document.getElementById(pageName).style.display = "block";
  elmnt.style.backgroundColor = color;
  refreshTabs();
}

(function blink() { 
  $('.blink').fadeOut(500).fadeIn(500, blink); 
})();

function refreshOptionShowPastDates(){
  document.getElementById("optionShowPastDates").checked = gOptionShowPastDates;
}

function handleOptionShowPastDates(){
  gOptionShowPastDates = document.getElementById("optionShowPastDates").checked;
  refreshTaskDates(false);
  //sendOptionShowPastDatesToESP();
}

function sendOptionShowPastDatesToESP(){
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
          response = this.responseText;
          showMessage("I", response, "messageOptions", gHideDelayDefault);
      }
  };
  xhttp.open("GET", "optionShowPastDates?value=" + gOptionShowPastDates?0:1, true);  //convert bool to int
  xhttp.send();
}

var canvas = document.createElement('canvas'); //Create a canvas element
var context = canvas.getContext('2d');

function blockAction(){
  //Set canvas width/height
  canvas.style.width='100%';
  canvas.style.height='100%';
  //Set canvas drawing area width/height
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  //Position canvas
  canvas.style.position='absolute';
  canvas.style.left=0;
  canvas.style.top=0;
  canvas.style.zIndex=100000;
  //canvas.style.pointerEvents='none'; //Make sure you can click 'through' the canvas
  document.body.appendChild(canvas); //Append canvas to body element
  
  //Draw rectangle
  context.rect(0, 0, screen.width, screen.height);
  context.fillStyle = 'white';
  context.globalAlpha = 0.5;
  context.fill();
//  setTimeout(function () { allowAction(); }, 3 *1000);
}

function allowAction(){
  context.clearRect(0, 0 , screen.width,screen.height);
  canvas.style.pointerEvents='none';
}

function refreshTabs(){
  // Description DATES /////////////////////////////////////
  var description = "";
  if(gNoDates){
    description += "<div style='color: orange'>Es sind noch keine Abholtermine gespeichert!</div><br>";
  } else if(gFutureDates == 0){
    description += "<div style='color: orange'>Es liegen keine zukünftigen Abholtermine vor.</div><br>";
  } else {    
    description += "In der Tabelle werden alle <b>Abfuhrtermine</b> und die <b>Müllart</b> angezeigt.<br>";
  }
  if(gFutureDates == 0){description += "Neue Termine können über <a href='#' onclick=document.getElementById('download').click();><img src='https://raw.githubusercontent.com/tobiwern/TrashReminder_V2/main/pictures/download.svg'></a> auf die \"Müll-Erinnerung\" geladen werden.<br><br>";}
  if(!gNoDates && gOptionShowPastDates){ description +=  "Bereits verstrichene Termine werden ausgegraut dargestellt.<br><br>";}

  document.getElementById("descriptionDates").innerHTML = description;
//ToDo +: Move button handling here

  // Description SETTINGS ////////////////////////////////
  refreshOptionShowPastDates();

  // Description DATA /////////////////////////////////////
  var description = "";
  var buttonDelete = "";
  if(!gNoDates){
    description += `
    <h3><div class="centeredHeight"><img src="https://github.com/tobiwern/TrashReminder_V2/blob/main/pictures/file-minus.svg?raw=true"> Löschen der Abholtermine</div></h3> 
    Über den nachstehenden Button können alle Abholtermine von der \"Müll-Erinnerung\" gelöscht werden:<br><br>`;
    buttonDelete = "<button class='button' onclick='deleteTasksOnESP()'>Abfuhrtermine löschen</button>";
  }
  document.getElementById("descriptionData").innerHTML = description;
  document.getElementById("buttonDeleteTasks").innerHTML = buttonDelete;
}

function createWebpage() {
    var innerHTML = `
    <div><img src='https://github.com/tobiwern/TrashReminder_V2/blob/main/pictures/TrashReminder.jpg?raw=true' alt='Trash Reminder' width='100%' ></div>
    <div class=tabbackground >
      <button class="tablink" onclick="openPage('tab_dates', this, '#4CAF50')" id="dates"><img class=icon src=https://raw.githubusercontent.com/tobiwern/TrashReminder_V2/main/pictures/truck_white.svg></button>
      <button class="tablink" onclick="openPage('tab_settings', this, '#4CAF50')" id="settings"><img class=icon src=https://raw.githubusercontent.com/tobiwern/TrashReminder_V2/main/pictures/settings_white.svg></button>
      <button class="tablink" onclick="openPage('tab_download', this, '#4CAF50')" id="download"><img class=icon src=https://raw.githubusercontent.com/tobiwern/TrashReminder_V2/main/pictures/download_white.svg></button>
      <button class="tablink" onclick="openPage('tab_help', this, '#4CAF50')" id="help"><img class=icon src=https://raw.githubusercontent.com/tobiwern/TrashReminder_V2/main/pictures/help_white.svg></button>
    </div>

    <div id="tab_dates" class="tabcontent">
      <div class=frame>
        <h2><div class='centeredHeight'><img src='https://github.com/tobiwern/TrashReminder_V2/blob/main/pictures/truck.svg?raw=true'>Abfuhrtermine</div></h2>
        <div id='descriptionDates'></div>
        <div id='buttonAcknowledge'></div>
        <div id='messageAcknowledge'></div>
        <div id='taskDates'></div>
      </div>
    </div>

    <div id="tab_settings" class="tabcontent">
      <div class=frame> 
        <h2><div class='centeredHeight'><img src='https://github.com/tobiwern/TrashReminder_V2/blob/main/pictures/settings.svg?raw=true'> Einstellungen</div></h2>    
        Auf dieser Seite können Einstellungen für die "Müll-Erinnerung" geändert werden.<br><br> 
        <hr>
        <h3><div class='centeredHeight'><img src='https://github.com/tobiwern/TrashReminder_V2/blob/main/pictures/clock.svg?raw=true'> Zeitpunkt der Erinnerung</div></h3>
        <table>
          <tr>
            <td class=description><label for="start">Start der Erinnerung<br>(am Vortag der Abholung):</label></td>
            <td class=value><select id="start" name="start" onchange='sendDropDownStateToESP("start")'></select></td>
          </tr>
          <tr>
            <td class=description><label class='fancy-input' for="end">Ende der Erinnerung<br>(am Tag der Abholung):</label></td>
            <td class=value><select id="end" name="end" onchange='sendDropDownStateToESP("end")'></select></td>
          </tr>
        </table><br>
        <div id='messageTime'></div>

        <hr>
        <h3><div class='centeredHeight'><img src='https://github.com/tobiwern/TrashReminder_V2/blob/main/pictures/trash.svg?raw=true'> Abfallarten</div></h3>
        <div id='taskTypes'></div>
        <div id='messageTaskTypes'></div>

        <hr>
        <h3><div class='centeredHeight'><img src='https://github.com/tobiwern/TrashReminder_V2/blob/main/pictures/watch.svg?raw=true'> Optionen</div></h3>
        <table width="80%">
          <tr>
          <td><input type='checkbox' id="optionShowPastDates" onchange='handleOptionShowPastDates()'>
          <label for="optionShowPastDates">Vergangene Termine anzeigen</label></td>
          </tr>
        </table><br>
        <div id='messageOptions'></div>

        <hr>
        <h3><div class='centeredHeight'><img src='https://github.com/tobiwern/TrashReminder_V2/blob/main/pictures/watch.svg?raw=true'> Zeit Einstellungen</div></h3>
        Die folgenden Einstellungen werden normalerweise automatisch ermittelt, können aber hier überschrieben werden.<br><br>
        <table width="80%">
          <tr>
            <td class=description><label for="start">Zeitzone:</label></td>
            <td class=value><select id="timezone" name="timezone" onchange='sendTimeZoneToESP()'></select></td>
          </tr>
          <tr>
            <td class=description><label for="start">NTP Zeit-Server:</label></td>
            <td class=value><input type="text" id="timeserver" name="timeserver" onchange='sendTimeServerToESP()''></td>
          </tr>
        </table><br>
        <div id='messageTime'></div>
      </div>        
    </div>

    <div id="tab_download" class="tabcontent">
      <div class=frame>      
        <h2><div class='centeredHeight'><img src='https://github.com/tobiwern/TrashReminder_V2/blob/main/pictures/download.svg?raw=true'> Daten für Abfuhrtermine</div></h2>
        <div>Falls sich Änderungen an den Abfuhrterminen ergeben haben oder Termine für das nächste Jahr gespeichert werden sollen, könnnen neue Abfuhrtermine auf die "Müll-Erinnerung" geladen werden. Hierbei werden die bestehenden Daten <b>überschrieben</b>!</div>
        <hr>
        <table>
          <tr><td><label for="start">Wählen Sie eine oder mehrere bereits heruntergeladene ICS oder ICAL Dateien ihres Entsorgungsunternehmens aus:</label><br><br></td></tr>
          <tr><td><label class="button"><input style="display:none;" type="file" name="files" id="files" accept=".ics" onchange="processFiles()" multiple>Hochladen...</label><br></td></tr>
          <tr><td><div id='tasks'></div></td></tr>
        </table>

        <h3><div class='centeredHeight'><img src='https://github.com/tobiwern/TrashReminder_V2/blob/main/pictures/download-cloud.svg?raw=true'>Von wo bekomme ich die Termine?</div></h3>
        <div>Die Abfuhrdaten werden üblicherweise durch das Entsorgungsunternehmen auf einer Webseite im ICS oder ICAL Format
        angeboten und müssen zuerst heruntergeladen werden. Suchen sie über Ihren Browser nach "Abfuhrtermine" oder "Abfallkalender" + Ihrem Ort, z.B. "Abfuhrtermine Weil im Schönbuch".</div><br>
        <div>Beispiele für Unternehmen, bei denen ICS Dateien heruntergeladen werden können:
        <ul>
          <li><a href='https://www.abfall-kreis-tuebingen.de/online-abfuhrtermine/' target='_blank'>https://www.abfall-kreis-tuebingen.de/online-abfuhrtermine/</a></li>
          <li><a href='https://www.bogenschuetz-entsorgung.de/blaue-tonne-tuebingen/abfuhrtermine.html'  target='_blank'>https://www.bogenschuetz-entsorgung.de/blaue-tonne-tuebingen/abfuhrtermine.html</a></li>
        </ul>
        </div>
        <div>Sobald sie die ICS oder ICAL Datei auf Ihr Handy oder ihren Computer heruntergeladen haben, können Sie diese über den Button "Hochladen..." auswählen und auf die "Müll-Erinnerung" laden. 
        Es können auch mehrere Dateien ausgewählt werden, falls mehrere Unternehmen die Abfuhr übernehmen.</div>
        <div id='descriptionData'></div> 
        <div id='buttonDeleteTasks'></div><br>
        <div id='messageDeleteTasks'></div>           
      </div>
    </div>

    <div id="tab_help" class="tabcontent">
      <div class=frame>
        <h2><div class='centeredHeight'><img src='https://github.com/tobiwern/TrashReminder_V2/blob/main/pictures/github.svg?raw=true'> Bedienungsanleitung</div></h2>
        Mehr Infos zur "Müll-Erinnerung gibt es unter <a href='https://tobiwern.github.io/TrashReminder_V2/' target='_blank'>https://tobiwern.github.io/TrashReminder/</a>
        <br><br>
        <div id='buttonMessage'></div>
        <button class="button" onclick="restartTrashReminder()">TrashReminder neu starten</button>
        <button class="button" onclick="fireworks()">Feuerwerk</button>
        <button class="button" id="demoButton" onclick="toggleDemo()">Demo Mode starten</button>
        <button class="button" onclick="requestLogFromESP()"  ondblclick="deleteLogOnESP()">Logfile anzeigen</button>
        <button class="button" onclick="resetWifiSettingsOnESP()">WLAN Einstellungen löschen</button>
        <h3>Kontakt</h3>
        <p>Tobias Werner, Erfindungen aller Art</p>
      </div>
    </div>
    `;
    document.getElementById("body").innerHTML = innerHTML;
    addFavicon();
    document.getElementById("dates").click();
    refreshTabs();
}
