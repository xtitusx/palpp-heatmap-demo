/**
 * Created by benja on 17/11/2016.
 */

function doStuff(data) {
  var canvas = document.getElementById('heatmap');
  var canvasWidth = canvas.offsetWidth;
  var canvasHeight = canvas.offsetHeight;
  var paper = Raphael('heatmap', canvasWidth, canvasHeight);
  var svg = document.getElementsByTagName('svg');
  svg[0].style.position = "absolute";
  //console.log(svg[0]);
  paper.path(buildPathString(data,canvasWidth,canvasHeight));
}

function buildPathString(data,width,height) {
  var totalPoints = data.length - 1;
  //console.log(totalPoints);
  var pathString = "";
  for (var len = 0; len < totalPoints; len++) {
    var normPosX = data[len]['norm_pos_x'];
    var normPosY = data[len]['norm_pos_y'];
    //console.log(normPosX + " " + normPosY);
    var posX = Math.round(normPosX*width);
    var posY = Math.round(normPosY*height);
    console.log(posX+" "+posY);
    if (pathString === "") {
      pathString = "M" + posX + "," + posY;
    } else {
      pathString += "L"+posX + "," + posY;
    }
  }
  //console.log(pathString);
  return pathString;
}

function parseData(url, callBack) {
  Papa.parse(url, {
    download: true,
    header: true,
    complete: function(results) {
      callBack(results.data);
    }
  });
}

parseData("http://localhost:63342/palpp-heatmap-demo/app/input/gaze_postions.csv", doStuff);
