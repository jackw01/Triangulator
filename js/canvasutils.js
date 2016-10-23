/*
canvasutils.js
Copyright (C) 2015-2016 jackw01
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


// Draw cardinal spline
CanvasRenderingContext2D.prototype.cardinalSpline = function(points, tension, closed, segments) {

    var pts = [], curvePoints = [], x, y,
        t1x, t2x, t1y, t2y, // Tension vector
        c1, c2, c3, c4, // Cardinal points
        steps, t, i; // Steps

    for (i = 0; i < points.length; i++) {

        pts.push(points[i][0]);
        pts.push(points[i][1]);
    }

    if (closed) {

        pts.unshift(pts[pts.length - 1]);
        pts.unshift(pts[pts.length - 2]);
        pts.unshift(pts[pts.length - 1]);
        pts.unshift(pts[pts.length - 2]);
        pts.push(pts[0]);
        pts.push(pts[1]);

    } else {

        pts.unshift(pts[1]);
        pts.unshift(pts[0]);
        pts.push(pts[pts.length - 2]);
        pts.push(pts[pts.length - 1]);
    }

    for (i = 2; i < (pts.length - 4); i += 2) {
        for (t = 0; t <= segments; t++) {

            t1x = (pts[i+2] - pts[i-2]) * tension;
            t2x = (pts[i+4] - pts[i]) * tension;

            t1y = (pts[i+3] - pts[i-1]) * tension;
            t2y = (pts[i+5] - pts[i+1]) * tension;

            steps = t / segments;

            c1 = 2 * Math.pow(steps, 3) - 3 * Math.pow(steps, 2) + 1;
            c2 = -(2 * Math.pow(steps, 3)) + 3 * Math.pow(steps, 2);
            c3 = Math.pow(steps, 3) - 2 * Math.pow(steps, 2) + steps;
            c4 = Math.pow(steps, 3) - Math.pow(steps, 2);

            x = c1 * pts[i] + c2 * pts[i+2] + c3 * t1x + c4 * t2x;
            y = c1 * pts[i+1] + c2 * pts[i+3] + c3 * t1y + c4 * t2y;

            curvePoints.push(x);
            curvePoints.push(y);
        }
    }

    for(i = 0; i < curvePoints.length-1; i += 2) {

        this.lineTo(curvePoints[i], curvePoints[i + 1]);
    }
};
