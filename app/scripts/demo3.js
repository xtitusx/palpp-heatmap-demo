/**
 * Created by benja on 18/11/2016.
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

function Record(duration, frequency ) {
  this.duration = duration;
  this.frequency = frequency;
}

function Demo(paper, dataArray, pathNodeNumber, strokeColor, strokeWidth, headCircleColor, headCircleRadius, tailCircleColor, tailCircleRadius) {
  this.paper = paper;
  this.pathNodeNumber = pathNodeNumber;
  this.strokeColor = strokeColor;
  this.strokeWidth = strokeWidth;
  this.headCircleColor = headCircleColor;
  this.headCircleRadius = headCircleRadius;
  this.tailCircleColor = tailCircleColor;
  this.tailCircleRadius = tailCircleRadius;
  this.nodeArray = [];
  this.duration = null;
  this.headNodeCircleArray = [];
  this.tailNodeCircleArray = [];
  this.pathArray = [];

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

  this.initNodeArray();

  this.estimateFrequency = function() {
    var len = this.nodeArray.length - 1;
    var startTime =  this.nodeArray[0].timestamp;
    var stopTime = this.nodeArray[len].timestamp;
    var frequency = len / (stopTime - startTime);
    return frequency;
  }

  this.buildProgressivePath = function() {
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
      var circle = this.paper.circle(this.nodeArray[indexNode].posX, this.nodeArray[indexNode].posY, radius);
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
}

function Node(posX, posY, timestamp, duration) {
  this.posX = posX;
  this.posY = posY;
  this.timestamp = timestamp;
  this.duration = duration;
}

function doStuff(data) {
  var canvas = document.getElementById('heatmap');
  var canvasWidth = canvas.offsetWidth;
  var canvasHeight = canvas.offsetHeight;
  var paper = Raphael('heatmap', canvasWidth, canvasHeight);
  var demo = new Demo(paper, data, 6, "#FF0000", 4, "#ED7F10", 6, "#0000FF", 3);
  var record = new Record(demo.nodeArray[demo.nodeArray.length - 1].timestamp - demo.nodeArray[0].timestamp, demo.estimateFrequency());
  var svg = document.getElementsByTagName('svg');
  svg[0].style.position = "absolute";

  demo.buildProgressivePath();
  //console.log(demo.pathArray);
  demo.drawNodeCircle("head");
  demo.drawNodeCircle("tail");
  var line = paper.path(demo.pathArray[0]);
  line.attr({"stroke": demo.strokeColor, "stroke-width": demo.strokeWidth}).toBack();
  var next = 1;
  var nodeNumber = demo.pathNodeNumber;

  function animate() {
    if (demo.pathArray[next]) {
      var duration = demo.nodeArray[nodeNumber - 1].duration;
      demo.headNodeCircleArray[nodeNumber - 1].hide();
      demo.tailNodeCircleArray[nodeNumber - demo.pathNodeNumber].hide();
      line.animate({ path: demo.pathArray[next] }, duration, 'linear', animate);
      demo.headNodeCircleArray[nodeNumber].show().toFront();
      if (next !== 1) {
        demo.tailNodeCircleArray[nodeNumber - 1].show();
      } else {
        for (var index = 1; index < demo.pathNodeNumber; index++) {
          demo.tailNodeCircleArray[nodeNumber - index].show();
        }
      }
      //console.log(demo.pathArray[next] + " " + demo.headNodeCircleArray[nodeNumber].attr('cx') + " " + demo.headNodeCircleArray[nodeNumber].attr('cy'));
      nodeNumber++;
      next++;
    }
    else {
      demo.headNodeCircleArray[nodeNumber - 1].hide();
      for (var index = 2; index <= demo.pathNodeNumber; index++) {
        demo.tailNodeCircleArray[nodeNumber - index].hide();
      }
      line.hide();
      demo.duration = new Date().getTime() - startTime;
      console.log("End, demo duration : " + demo.duration + "ms (Record duration : " + Math.round(record.duration * 1000) + "ms, record frequency : " + record.frequency + "Hz)");
    }
  }

  var startTime = new Date().getTime();
  animate();
}
