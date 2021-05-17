/**
 * Created by benja on 27/11/2016.
 */

parseData("http://localhost:63342/palpp-heatmap-demo/app/input/gaze_postions.csv", "pupil", "csv", "heatmap", doStuff);
//parseData("http://localhost:63342/palpp-heatmap-demo/app/input/data.json", "pupil", "json", "heatmap", doStuff);
//parseData("http://localhost:63342/palpp-heatmap-demo/app/input/smi.csv", "smi", "csv", "heatmap", doStuff);

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

function Record(dataArray, paper) {
  this.paper = paper;
}

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
        //console.log(posX);
        var posY = Math.round(dataArray[len]['gazeOnSurfaces'][0]['norm_pos'][1] * this.paper.height);
        //console.log(posY);
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
    // TODO limit posX & posY fixed to 4000... (Start Loc.X = 223478.95 line 10931,...)
    var limitPosX = limitPosY = 4000;
    var maxPosX = maxPosY = 0;
    for (var len = 0; len < dataArray.length; len++) {
      try {
        var posX = Math.round(dataArray[len]['Start Loc.X']);
        var posY = Math.round(dataArray[len]['Start Loc.Y']);
        //console.log(posX + " " + posY);
        if ((posX > limitPosX) || (posY > limitPosY)) {
          continue;
        }
        if (posX > maxPosX) {
          maxPosX = posX;
        }
        if (posY > maxPosY) {
          maxPosY = posY;
        }
      } catch (error) {
        console.log(len + " : " + error.stack);
        //console.log((dataArray[len]));
      }
      finally {
        continue;
      }
    }
    //console.log (maxPosX + " " + maxPosY);
    var ratioX = this.paper.width / maxPosX;
    var ratioY = this.paper.height / maxPosY;

    for (var len = 0; len < dataArray.length; len++) {
      try {
        var posX =  Math.round(dataArray[len]['Start Loc.X'] * ratioX);
        //console.log(posX);
        var posY = Math.round(dataArray[len]['Start Loc.Y'] * ratioY);
        //console.log(posY);
        if (isNaN(posX)) { // EOF
          continue;
        }
        if ((posX === 0) && (posY === 0)) {
          //TODO Blink event
          continue;
        }
        if (posX < 0 || posY < 0 || posX > limitPosX || posY > limitPosY) {
          continue;
        }
        var timestamp = Math.round(dataArray[len]['Start'] / 1000);
        //console.log(timestamp);
        var duration = null;
        if (len > 0) {
          duration = Math.round((timestamp - this.nodeArray[this.nodeArray.length - 1].timestamp));
        }
        var node = new Node(posX, posY, timestamp, duration);
        //console.log(node.timestamp + " " + node.posX + " " + node.posY + " " + node.duration);
        this.nodeArray.push(node);
      } catch (error) {
        console.log(len + " : " + error.stack);
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
  this.isHidden = true;

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

  }

  this.show = function() {
    if (this.isHidden) {
      this.heatmapInstance.setData(this.data);
      this.isHidden = false;
    }
  }

  this.hide = function () {
    if (!this.isHidden) {
      this.heatmapInstance._renderer.canvas.remove();
      this.isHidden = true;
    }

  }

  this.delete = function() {
    this.hide();
    this.heatmapInstance = null;
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
    this.path = null;
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
  this.state = null;
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
    if ((this.state === null) || (this.state === "play")) {
      if (this.line === null) {
        this.state = "play";
        this.line = record.paper.path(this.pathArray[0]);
        this.line.attr({"stroke": this.strokeColor, "stroke-width": this.strokeWidth}).toBack();
        this.next = 1;
        this.nodeNumber = this.pathNodeNumber;
        this.startTime = new Date().getTime();
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
      }
    } else if (this.state == "pause") {
      return;
    }
  }

  this.pause = function () {
    this.state = "pause";
  }

  this.resume = function() {
    this.state = "play";
    this.animate(1);
  }

  this.stop = function() {
    this.pause();
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
  heatMap.show();
  heatMap.hide();
  //heatMap.delete();

  var fullPath = new FullPath(record);
  fullPath.build();
  fullPath.show();
  fullPath.hide();
  //fullPath.delete();

  var progressivePath = new ProgressivePath(record, 6, "#FF0000", 4, "#ED7F10", 6, "#0000FF", 3);
  progressivePath.build();
  progressivePath.animate(1);

  setTimeout(function() {
    console.log("pause");
    progressivePath.pause();
  }, 3000);

  setTimeout(function() {
    console.log("resume");
    progressivePath.resume();
  }, 5000);

  setTimeout(function() {
    console.log("pause");
    progressivePath.pause();
  }, 10000);

  setTimeout(function() {
    console.log("resume");
    progressivePath.resume();
  }, 15000);

  setTimeout(function() {
    console.log("stop");
    progressivePath.stop();
  }, 20000);
}
