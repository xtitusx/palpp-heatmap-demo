/**
 * Created by benja_000 on 18/11/2016.
 */
// minimal heatmap instance configuration

 var heatmapInstance = h337.create({
 // only container is required, the rest will be defaults
 container: document.querySelector('#heatmap')
 });

 var canvas = document.getElementById('heatmap');

 // now generate some random data
 var points = [];
 var max = 0;
 var width = canvas.offsetWidth;
 var height = canvas.offsetHeight;
 var len = 200;

 while (len--) {
 var val = Math.floor(Math.random()*100);
 max = Math.max(max, val);
 var point = {
 x: Math.floor(Math.random()*width),
 y: Math.floor(Math.random()*height),
 value: val
 };
 points.push(point);
 }
 // heatmap data format
 var data = {
 max: max,
 data: points
 };
 // if you have a set of datapoints always use setData instead of addData
 // for data initialization
 heatmapInstance.setData(data);
