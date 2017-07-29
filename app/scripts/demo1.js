/**
 * Created by benja on 17/11/2016.
 */
function doStuff(data) {
  //Data is usable here
  //console.log(data);
  var heatmapInstance = h337.create({
    // only container is required, the rest will be defaults
    container: document.querySelector('#heatmap')
  });
  var canvas = document.getElementById('heatmap');
  var canvasWidth = canvas.offsetWidth;
  var canvasHeight = canvas.offsetHeight;
  // now generate some random data
  var points = [];
  var max = 0;
  var len =  data.length;
  while (len--) {
    var normPosX = data[len]['norm_pos_x'];
    var normPosY = data[len]['norm_pos_y'];
    //console.log(normPosX + " " + normPosY);
    var posX = Math.round(normPosX*canvasWidth);
    var posY = Math.round(normPosY*canvasHeight);
    //console.log(posX + " " + posY);
    var point = {
      x: posX,
      y: posY,
      value: 1
    };
    points.push(point);

  }
  // heatmap data format
  var data = {
    max: 60,
    data: points
  };
  // if you have a set of datapoints always use setData instead of addData
  // for data initialization
  heatmapInstance.setData(data);
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

parseData("http://localhost:63342/PALPP-HeatmapDemo/app/input/gaze_postions.csv", doStuff);
