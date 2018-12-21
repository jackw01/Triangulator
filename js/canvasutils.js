/*
canvasutils.js
Copyright (C) 2015-2016 jackw01
This program is distrubuted under the MIT License, see LICENSE for details
*/

// Set fill/stroke
CanvasRenderingContext2D.prototype.fillRGB = function(r, g, b) {
  this.fillStyle = "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
};

CanvasRenderingContext2D.prototype.fillRGBA = function(r, g, b, a) {
  this.fillStyle = "rgba(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + "," + Math.round(a) + ")";
};

CanvasRenderingContext2D.prototype.fillHSL = function(h, s, l) {
  this.fillStyle = "hsl(" + Math.round(h) + "," + Math.round(s) + "%," + Math.round(l) + "%)";
};

CanvasRenderingContext2D.prototype.fillHSLA = function(h, s, l, a) {
  this.fillStyle = "hsla(" + Math.round(h) + "," + Math.round(s) + "%," + Math.round(l) + "%," + Math.round(a) + ")";
};

CanvasRenderingContext2D.prototype.strokeRGB = function(r, g, b) {
  this.strokeStyle = "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
};

CanvasRenderingContext2D.prototype.strokeRGBA = function(r, g, b, a) {
  this.strokeStyle = "rgba(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + "," + Math.round(a) + ")";
};

CanvasRenderingContext2D.prototype.strokeHSL = function(h, s, l) {
  this.strokeStyle = "hsl(" + Math.round(h) + "," + Math.round(s) + "%," + Math.round(l) + "%)";
};

CanvasRenderingContext2D.prototype.strokeHSLA = function(h, s, l, a) {
  this.strokeStyle = "hsla(" + Math.round(h) + "," + Math.round(s) + "%," + Math.round(l) + "%," + Math.round(a) + ")";
};
