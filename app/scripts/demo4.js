/**
 * Created by benja_000 on 23/11/2016.
 */

parseData("http://localhost:63342/PALPP-HeatmapDemo/app/input/gaze_postions.csv", doStuff);

function parseData(url, callBack) {
  Papa.parse(url, {
    download: true,
    header: true,
    complete: function(results) {
      callBack(results.data);
    }
  });
}

function Record(dataArray, paper, duration) {
  this.paper = paper;
  this.duration = duration;
  this.nodeArray = [];
  this.frequency = null;

  this.initNodeArray = function() {
    for (var len = 0; len < dataArray.length; len++) {
      if (dataArray[len]['norm_pos_x'] !== undefined) {
        var posX = Math.round(dataArray[len]['norm_pos_x'] * this.paper.width);
        var posY = Math.round(dataArray[len]['norm_pos_y'] * this.paper.height);
        var timestamp = dataArray[len]['timestamp'];
        var duration = null;
        if (len > 0) {
          duration = Math.round((timestamp - this.nodeArray[len - 1].timestamp) * 1000);
        }
        var node = new Node(posX, posY, timestamp, duration);
        //console.log(node.timestamp + " " + node.posX + " " + node.posY + " " + node.duration);
        this.nodeArray.push(node);
      }
    }
  }

  this.calculateDuration = function () {
    this.duration = this.nodeArray[this.nodeArray.length - 1].timestamp - this.nodeArray[0].timestamp;
  }

  this.estimateFrequency = function() {
    var len = this.nodeArray.length - 1;
    var startTime =  this.nodeArray[0].timestamp;
    var stopTime = this.nodeArray[len].timestamp;
    this.frequency = len / (stopTime - startTime);
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

  this.animate = function (line, next, nodeNumber, startTime, corrector) {
    if (line === null) {
      line = record.paper.path(this.pathArray[0]);
      line.attr({"stroke": this.strokeColor, "stroke-width": this.strokeWidth}).toBack();
      next = 1;
      nodeNumber = this.pathNodeNumber;
      startTime = new Date().getTime();
    }
    if (this.pathArray[next]) {
      var duration = this.nodeArray[nodeNumber - 1].duration;
      var correctedDuration = duration * corrector;
      var lineStartTime = new Date().getTime();
      if (next !== 1) {
        this.headNodeCircleArray[nodeNumber - 1].hide();
        this.tailNodeCircleArray[nodeNumber - this.pathNodeNumber].hide();
        //console.log(this.pathArray[next] + " " + this.tailNodeCircleArray[nodeNumber - this.pathNodeNumber].attr('cx') + " " + this.tailNodeCircleArray[nodeNumber - this.pathNodeNumber].attr('cy'));
        this.tailNodeCircleArray[nodeNumber - 1].show();
        //console.log(this.pathArray[next] + " " + this.tailNodeCircleArray[nodeNumber - 1].attr('cx') + " " + this.tailNodeCircleArray[nodeNumber - 1].attr('cy'));
      } else {
        for (var index = 1; index < this.pathNodeNumber; index++) {
          this.tailNodeCircleArray[nodeNumber - index].show();
          //console.log(this.pathArray[next] + " " + this.tailNodeCircleArray[nodeNumber - index].attr('cx') + " " + this.tailNodeCircleArray[nodeNumber - index].attr('cy'));
        }
      }
      this.headNodeCircleArray[nodeNumber].show().toFront();
      //console.log(this.pathArray[next] + " " + this.headNodeCircleArray[nodeNumber].attr('cx') + " " + this.headNodeCircleArray[nodeNumber].attr('cy'));
      var that = this;
      line.animate({ path: this.pathArray[next] }, correctedDuration, 'linear', function () {
        var lineElapsedTime = new Date().getTime() - lineStartTime;
        var corrector = correctedDuration / lineElapsedTime;
        //console.log("Next : " + next + ", elapsed time : " + lineElapsedTime + ", duration : " + duration + ", corrector : " + corrector);
        nodeNumber++;
        next++;
        that.animate(line, next, nodeNumber, startTime, corrector);
      });
    }
    else {
      this.headNodeCircleArray[nodeNumber - 1].hide();
      for (var index = 2; index <= this.pathNodeNumber; index++) {
        this.tailNodeCircleArray[nodeNumber - index].hide();
      }
      line.hide();
      this.duration = new Date().getTime() - startTime;
      console.log("End, demo duration : " + this.duration + "ms (Record duration : " + Math.round(record.duration * 1000) + "ms, record frequency : " + record.frequency + "Hz)");
    }
  }
}

function doStuff(data) {
  var canvas = document.getElementById('heatmap');
  var canvasWidth = canvas.offsetWidth;
  var canvasHeight = canvas.offsetHeight;
  var paper = Raphael('heatmap', canvasWidth, canvasHeight);
  var svg = document.getElementsByTagName('svg');
  svg[0].style.position = "absolute";
  var record = new Record(data, paper);
  var progressivePath = new ProgressivePath(record, 6, "#FF0000", 4, "#ED7F10", 6, "#0000FF", 3);
  progressivePath.build();
  progressivePath.drawNodeCircle("head");
  progressivePath.drawNodeCircle("tail");
  progressivePath.animate(null, null, null, null, 1);
}
