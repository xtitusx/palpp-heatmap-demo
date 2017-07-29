/**
 * Created by benja_000 on 29/11/2016.
 */

//parseData("http://localhost:63342/PALPP-HeatmapDemo/app/input/gaze_postions.csv", "pupil", "csv", "heatmap", doStuff);
parseData("http://localhost:63342/PALPP-HeatmapDemo/app/input/data.json", "pupil", "json", "heatmap", doStuff);

/* parseData params :
param 1 : url du fichier à traiter (accepte les fichiers JSON et CSV avec Header en 1ère ligne et les données sur les autres lignes)
param 2 : type du device de capture (accepte pupil et smi)
param 3 : extension du fichier à traiter (accepte JSON et CSV, voir param 1)
param 4 : id de l'élement html dans lequel s'insère la carte de chaleur et les chemins (ne pas modifier si le script est exécuté dans demo.html)
param 5 : fonction appellée en rappel après le parse (ne pas modifier)
*/

// Exemple de lancement du traitement d'un fichier CSV "smi.csv" du device smi :
//parseData("http://localhost:63342/PALPP-HeatmapDemo/app/input/smi.csv", "smi", "csv", "heatmap", doStuff);

function parseData(url, device, type, canvasId, callBack) {
  switch(type) {
    case "json":
      $.ajax({
        url : url,
        dataType : 'json',
        success : function(data){
          //console.log(data);
          callBack(data, device, type, canvasId);
        }
      });
      break;
    case "csv":
      Papa.parse(url, {
        download: true,
        header: true,
        complete: function(results) {
          //console.log(results.data);
          callBack(results.data, device, type, canvasId);
        }
      });
      break;
    case "middleware":
      //TODO
      break;
  }
}

Record.prototype.nodeArray = [];
Record.prototype.frequency = null;

Record.prototype.calculateDuration = function () {
  this.duration = this.nodeArray[this.nodeArray.length - 1].timestamp - this.nodeArray[0].timestamp;
}

Record.prototype.estimateFrequency = function() {
  var len = this.nodeArray.length - 1;
  var startTime =  this.nodeArray[0].timestamp;
  var stopTime = this.nodeArray[len].timestamp;
  this.frequency = len / (stopTime - startTime);
}

function Record() {}

PupilRecordCsv = function(dataArray, paper) {
  this.paper = paper;

  for (key in Record.prototype) {
    PupilRecordCsv.prototype[key] = Record.prototype[key];
    //console.log(Record.prototype[key]);
  }

  this.initNodeArray = function() {
    for (var len = 0; len < dataArray.length; len++) {
      if (dataArray[len]['norm_pos_x'] !== undefined) {
        var posX = Math.round(dataArray[len]['norm_pos_x'] * this.paper.width);
        var posY = Math.round(dataArray[len]['norm_pos_y'] * this.paper.height);
        if (posX < 0 || posY < 0 || posX > this.paper.width || posY > this.paper.height) {
          continue;
        }
        var timestamp = dataArray[len]['timestamp'];
        var duration = null;
        if (len > 0) {
          duration = Math.round((timestamp - this.nodeArray[this.nodeArray.length - 1].timestamp) * 1000);
        }
        var node = new Node(posX, posY, timestamp, duration);
        //console.log(node.timestamp + " " + node.posX + " " + node.posY + " " + node.duration);
        this.nodeArray.push(node);
      }
    }
  }

  this.initNodeArray();
  this.calculateDuration();
  this.estimateFrequency();
}

PupilRecordJson = function(dataArray, paper) {
  this.paper = paper;

  for (key in Record.prototype) {
    PupilRecordJson.prototype[key] = Record.prototype[key];
    //console.log(Record.prototype[key]);
  }

  this.initNodeArray = function() {
    for (var len = 0; len < dataArray.length; len++) {
      try {
        var posX = Math.round(dataArray[len]['gazeOnSurfaces'][0]['norm_pos'][0] * this.paper.width);
        var posY = Math.round(dataArray[len]['gazeOnSurfaces'][0]['norm_pos'][1] * this.paper.height);
        //console.log(posX + " " + posY);
        if (posX < 0 || posY < 0 || posX > this.paper.width || posY > this.paper.height) {
          continue;
        }
        var timestamp = dataArray[len]['timestamp'];
        timestamp = timestamp.toFixed(4);
        //console.log(timestamp);
        var duration = null;
        if (len > 0) {
          duration = Math.round((timestamp - this.nodeArray[this.nodeArray.length - 1].timestamp) * 1000);
        }
        var node = new Node(posX, posY, timestamp, duration);
        //console.log(node.timestamp + " " + node.posX + " " + node.posY + " " + node.duration);
        this.nodeArray.push(node);
      } catch (error) {
        //console.log(len + " : " + error.stack);
        //console.log((dataArray[len]));
      }
      finally {
        continue;
      }
    }
  }

  this.initNodeArray();
  this.calculateDuration();
  this.estimateFrequency();
}

SmiRecord = function(dataArray, paper) {
  this.paper = paper;

  for (key in Record.prototype) {
    SmiRecord.prototype[key] = Record.prototype[key];
    //console.log(Record.prototype[key]);
  }

  this.initNodeArray = function() {
    var divisor = 1000;
    // TODO limit posX & posY fixed to 2000... (Start Loc.X = 223478.95 line 10931,...)
    var limitPosX = limitPosY = 2000;
    var maxPosX = maxPosY = 0;
    for (var len = 0; len < dataArray.length; len++) {
      try {
        var startPosX = Math.round(dataArray[len]['Start Loc.X']);
        var startPosY = Math.round(dataArray[len]['Start Loc.Y']);
        if ((startPosX > maxPosX) && (startPosX <= limitPosX) && (startPosY <= limitPosY) && (startPosY >= 0)) {
          maxPosX = startPosX;
        }
        if ((startPosY > maxPosY) && (startPosY <= limitPosY) && (startPosX <= limitPosX) && (startPosX >= 0)) {
          maxPosY = startPosY;
        }
      } catch (error) {
        //console.log(len + " : " + error.stack);
        //console.log((dataArray[len]));
      }
      finally {
        continue;
      }
    }
    //console.log(maxPosX + " " + maxPosY);
    var ratioX = this.paper.width / maxPosX;
    var ratioY = (this.paper.height) / maxPosY;
    var blinkDuration = 0;
    for (var len = 0; len < dataArray.length; len++) {
      try {
        var event = dataArray[len]['Event Type'];
        if (event === "Blink B") {
          blinkDuration = dataArray[len]['Duration'] / divisor;
        } else {
          var startPosX =  Math.round(dataArray[len]['Start Loc.X'] * ratioX);
          if (isNaN(startPosX)) {continue;} // EOF
          //console.log(dataArray[len]['Start Loc.X'] + " " + ratioX + " " + startPosX);
          var startPosY = Math.round(dataArray[len]['Start Loc.Y'] * ratioY);
          //console.log(dataArray[len]['Start Loc.Y'] + " " + ratioY + " " + startPosY);
          if ((startPosX >= 0) && (startPosY >= 0) && (startPosX <= this.paper.width) && (startPosY <= this.paper.height)) {
            var startTimestamp = Math.round(dataArray[len]['Start'] / divisor);
            //console.log(startTimestamp);
            var duration = null;
            if (this.nodeArray.length > 0) {
              duration = Math.round((startTimestamp - this.nodeArray[this.nodeArray.length - 1].timestamp) + blinkDuration);
              blinkDuration = 0;
            }
            var node = new Node(startPosX, startPosY, startTimestamp, duration);
            //console.log(node.timestamp + " " + node.posX + " " + node.posY + " " + node.duration);
            this.nodeArray.push(node);
          }
        }
      } catch (error) {
        //console.log(len + " : " + error.stack);
        //console.log((dataArray[len]));
      }
      finally {
        continue;
      }
    }
  }

  this.initNodeArray();
  this.calculateDuration();
  this.estimateFrequency();
}

function Node(posX, posY, timestamp, duration) {
  this.posX = posX;
  this.posY = posY;
  this.timestamp = timestamp;
  this.duration = duration;
}

function HeatMap(record) {
  this.nodeArray = record.nodeArray;
  this.canvasId = record.paper.canvas.parentNode.id;
  this.heatmapInstance = null;
  this.data = null;
  this.isHidden = false;

  this.build = function () {
    this.heatmapInstance = h337.create({
      container: document.querySelector('#' + this.canvasId)
    });
    var nodes = [];
    var len =  this.nodeArray.length;
    while (len--) {
      var posX = this.nodeArray[len].posX;
      var posY = this.nodeArray[len].posY;
      var point = {
        x: posX,
        y: posY,
        value: 1
      };
      nodes.push(point);
    }
    this.data = {
      max: 60,
      data: nodes
    };
    this.heatmapInstance.setData(this.data);
    this.hide();
  }

  this.show = function() {
    if (this.isHidden) {
      var canvas = document.getElementsByClassName(this.canvasId + "-canvas")[0];
      canvas.style.display = "block";
      this.isHidden = false;
    }
  }

  this.hide = function () {
    if (!this.isHidden) {
      var canvas = document.getElementsByClassName(this.canvasId + "-canvas")[0];
      canvas.style.display = "none";
      this.isHidden = true;
    }
  }

  this.delete = function() {
    this.heatmapInstance.setData({data:[]});
    this.heatmapInstance._renderer.canvas.remove();
  }
}

function FullPath(record) {
  this.nodeArray = record.nodeArray;
  this.pathString = "";
  this.path = null;
  this.isHidden = true;

  this.build = function() {
    for (var indexNode = 0; indexNode < this.nodeArray.length; indexNode++) {
      if (this.pathString === "") {
        this.pathString = "M" + this.nodeArray[indexNode].posX + "," + this.nodeArray[indexNode].posY;
      } else {
        this.pathString += "L" + this.nodeArray[indexNode].posX + "," + this.nodeArray[indexNode].posY;
      }
    }
    //console.log(this.pathString);
  }

  this.show = function() {
    if (this.isHidden) {
      this.path = record.paper.path(this.pathString);
      this.isHidden = false;
    }
  }

  this.hide = function() {
    if (!this.isHidden) {
      this.path.remove();
      this.isHidden = true;
    }
  }

  this.delete = function() {
    this.hide();
    this.pathString = "";
  }
}

function ProgressivePath(record, pathNodeNumber, strokeColor, strokeWidth, headCircleColor, headCircleRadius, tailCircleColor, tailCircleRadius) {
  this.nodeArray = record.nodeArray;
  this.pathNodeNumber = pathNodeNumber;
  this.strokeColor = strokeColor;
  this.strokeWidth = strokeWidth;
  this.headCircleColor = headCircleColor;
  this.headCircleRadius = headCircleRadius;
  this.tailCircleColor = tailCircleColor;
  this.tailCircleRadius = tailCircleRadius;
  this.headNodeCircleArray = [];
  this.tailNodeCircleArray = [];
  this.pathArray = [];
  this.state = "readyToplay";
  this.line = null;
  this.next = null;
  this.nodeNumber = null;
  this.startTime = null;

  this.build = function() {
    for (var indexNode = this.pathNodeNumber - 1; indexNode < this.nodeArray.length; indexNode++) {
      var pathString = "";
      for (var len = this.pathNodeNumber - 1; len >= 0; len--) {
        if (len === this.pathNodeNumber - 1) {
          pathString += 'M ' + this.nodeArray[indexNode - len].posX + ' ' + this.nodeArray[indexNode - len].posY;
        }
        else {
          pathString += ' L ' + this.nodeArray[indexNode - len].posX + ' ' + this.nodeArray[indexNode - len].posY;
        }
      }
      this.pathArray.push(pathString);
    }
    this.drawNodeCircle("head");
    this.drawNodeCircle("tail");
  }

  this.drawNodeCircle = function(type) { // Node type : head or tail
    var radius = null;
    var color = null;
    switch(type) {
      case "head":
        radius = this.headCircleRadius;
        color = this.headCircleColor;
        break;
      case "tail":
        radius = this.tailCircleRadius;
        color = this.tailCircleColor;
        break;
    }
    for (var indexNode = 0; indexNode < this.nodeArray.length; indexNode++) {
      var circle = record.paper.circle(this.nodeArray[indexNode].posX, this.nodeArray[indexNode].posY, radius);
      circle.attr("fill", color);
      circle.hide();
      switch(type) {
        case "head":
          this.headNodeCircleArray.push(circle);
          break;
        case "tail":
          this.tailNodeCircleArray.push(circle);
          break;
      }
    }
  }

  this.animate = function (corrector) {
    if ((this.state === "readyToplay") || (this.state === "resumed")) {
      if (this.state === "readyToplay") {
        this.line = record.paper.path(this.pathArray[0]);
        this.line.attr({"stroke": this.strokeColor, "stroke-width": this.strokeWidth}).toBack();
        this.next = 1;
        this.nodeNumber = this.pathNodeNumber;
        this.startTime = new Date().getTime();
        this.state = "resumed";
      }
      if (this.pathArray[this.next]) {
        var duration = this.nodeArray[this.nodeNumber - 1].duration;
        var correctedDuration = duration * corrector;
        var lineStartTime = new Date().getTime();
        if (this.next !== 1) {
          this.headNodeCircleArray[this.nodeNumber - 1].hide();
          this.tailNodeCircleArray[this.nodeNumber - this.pathNodeNumber].hide();
          //console.log(this.pathArray[next] + " " + this.tailNodeCircleArray[nodeNumber - this.pathNodeNumber].attr('cx') + " " + this.tailNodeCircleArray[nodeNumber - this.pathNodeNumber].attr('cy'));
          this.tailNodeCircleArray[this.nodeNumber - 1].show();
          //console.log(this.pathArray[next] + " " + this.tailNodeCircleArray[nodeNumber - 1].attr('cx') + " " + this.tailNodeCircleArray[nodeNumber - 1].attr('cy'));
        } else {
          for (var index = 1; index < this.pathNodeNumber; index++) {
            this.tailNodeCircleArray[this.nodeNumber - index].show();
            //console.log(this.pathArray[next] + " " + this.tailNodeCircleArray[nodeNumber - index].attr('cx') + " " + this.tailNodeCircleArray[nodeNumber - index].attr('cy'));
          }
        }
        this.headNodeCircleArray[this.nodeNumber].show().toFront();
        //console.log(this.pathArray[next] + " " + this.headNodeCircleArray[nodeNumber].attr('cx') + " " + this.headNodeCircleArray[nodeNumber].attr('cy'));
        var that = this;
        this.line.animate({path: this.pathArray[this.next]}, 0, 'linear', function () {
          setTimeout(function () {
            var lineElapsedTime = new Date().getTime() - lineStartTime;
            var corrector = correctedDuration / lineElapsedTime;
            console.log("Next : " + that.next + ", elapsed time : " + lineElapsedTime + ", duration : " + duration + ", corrector : " + corrector);
            that.nodeNumber++;
            that.next++;
            that.animate(corrector);
          }, correctedDuration);
        });
      }
      else {
        this.headNodeCircleArray[this.nodeNumber - 1].hide();
        for (var index = 2; index <= this.pathNodeNumber; index++) {
          this.tailNodeCircleArray[this.nodeNumber - index].hide();
        }
        this.line.hide();
        this.duration = new Date().getTime() - this.startTime;
        console.log("End, demo duration : " + this.duration + "ms (Record duration : " + Math.round(record.duration * 1000) + "ms, record frequency : " + record.frequency + "Hz)");
        this.state = "readyToplay";
      }
    } else if (this.state === "paused") {
      return;
    } else if (this.state === "stopped") {
      this.state = "readyToplay";
    }
  }

  this.pause = function () {
    this.state = "paused";
  }

  this.resume = function() {
    this.state = "resumed";
    this.animate(1);
  }

  this.stop = function() {
    if (this.state === "paused") {
      this.state = "readyToplay";
    } else {
      this.state = "stopped";
    }
    this.headNodeCircleArray[this.nodeNumber - 1].hide();
    this.headNodeCircleArray[this.nodeNumber].hide();
    for (var index = 1; index <= this.pathNodeNumber; index++) {
      this.tailNodeCircleArray[this.nodeNumber - index].hide();
    }
    this.line.hide();
    this.line = null;
  }
}

function doStuff(data, device, type, canvasId) {
  var canvas = document.getElementById(canvasId);
  var canvasWidth = canvas.offsetWidth;
  var canvasHeight = canvas.offsetHeight;
  var paper = Raphael(canvasId, canvasWidth, canvasHeight);
  var svg = document.getElementsByTagName('svg');
  svg[0].style.position = "absolute";

  switch(device) {
    case "eyetribe":
      // TODO
      break;
    case "pupil":
      switch(type) {
        case "csv":
          var record = new PupilRecordCsv(data, paper);
          break;
        case "json":
          var record = new PupilRecordJson(data, paper);
          break;
      }
      break;
    case "smi":
      var record = new SmiRecord(data, paper);
      break;
  }

  var heatMap = new HeatMap(record);
  heatMap.build();
  var fullPath = new FullPath(record);
  fullPath.build();
  var progressivePath = new ProgressivePath(record, 6, "#FF0000", 4, "#ED7F10", 7, "#0000FF", 4);
  progressivePath.build();
  console.log("Built.");

  function ProgressivePathButton() {
    var button = document.createElement("input");
    button.style.position = "absolute";
    button.style.width = "115px";
    button.type = "button";
    button.value = "ProgressivePath";
    button.style.opacity = "0.8";
    button.style.fontWeight = "bold";
    canvas.appendChild(button);
    button.addEventListener("click", function() {
      switch(progressivePath.state) {
        case "readyToplay":
          progressivePath.animate(1);
          break;
        case "paused":
          progressivePath.resume();
          break;
        case "resumed":
          progressivePath.pause();
          break;
      }
    });
  }

  function ProgressivePathStopButton() {
    var button = document.createElement("input");
    button.style.position = "absolute";
    button.style.width = "40px";
    button.style.left = "115px";
    button.type = "button";
    button.value = "Stop";
    button.style.opacity = "0.8";
    button.style.fontWeight = "bold";
    canvas.appendChild(button);
    button.addEventListener("click", function() {
      if ((progressivePath.state !== "stop") && (progressivePath.state !== "readyToplay")) {
        progressivePath.stop();
      }
    });
  }

  function FullPathButton() {
    var button = document.createElement("input");
    button.style.position = "absolute";
    button.style.width = "115px";
    button.style.top = "21px";
    button.type = "button";
    button.value = "FullPath";
    button.style.opacity = "0.8";
    button.style.fontWeight = "bold";
    canvas.appendChild(button);
    button.addEventListener("click", function() {
      switch(fullPath.isHidden) {
        case true:
          fullPath.show();
          break;
        case false:
          fullPath.hide();
          break;
      }
    });
  }

  function HeatMapButton() {
    var button = document.createElement("input");
    button.style.position = "absolute";
    button.style.width = "115px";
    button.style.top = "42px";
    button.type = "button";
    button.value = "HeatMap";
    button.style.opacity = "0.8";
    button.style.fontWeight = "bold";
    canvas.appendChild(button);
    button.addEventListener("click", function() {
      switch(heatMap.isHidden) {
        case true:
          heatMap.show();
          break;
        case false:
          heatMap.hide();
          break;
      }
    });
  }

  HeatMapButton();
  FullPathButton();
  ProgressivePathButton();
  ProgressivePathStopButton();
}
