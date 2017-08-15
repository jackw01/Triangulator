/*
Triangulator
Copyright (C) 2015-2017 jackw01

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Performs a Delaunay triangulation on a set of points
// Following code is in the public domain

var EPSILON = 1.0 / 1048576.0;

function supertriangle(vertices) {
    var xmin = Number.POSITIVE_INFINITY,
    ymin = Number.POSITIVE_INFINITY,
    xmax = Number.NEGATIVE_INFINITY,
    ymax = Number.NEGATIVE_INFINITY,
    i, dx, dy, dmax, xmid, ymid;

    for(i = vertices.length; i--; ) {
        if(vertices[i][0] < xmin) xmin = vertices[i][0];
        if(vertices[i][0] > xmax) xmax = vertices[i][0];
        if(vertices[i][1] < ymin) ymin = vertices[i][1];
        if(vertices[i][1] > ymax) ymax = vertices[i][1];
    }

    dx = xmax - xmin;
    dy = ymax - ymin;
    dmax = Math.max(dx, dy);
    xmid = xmin + dx * 0.5;
    ymid = ymin + dy * 0.5;

    return [
        [xmid - 20 * dmax, ymid -      dmax],
        [xmid            , ymid + 20 * dmax],
        [xmid + 20 * dmax, ymid -      dmax]
    ];
}

function circumcircle(vertices, i, j, k) {
    var x1 = vertices[i][0],
    y1 = vertices[i][1],
    x2 = vertices[j][0],
    y2 = vertices[j][1],
    x3 = vertices[k][0],
    y3 = vertices[k][1],
    fabsy1y2 = Math.abs(y1 - y2),
    fabsy2y3 = Math.abs(y2 - y3),
    xc, yc, m1, m2, mx1, mx2, my1, my2, dx, dy;

    /* Check for coincident points */
    if(fabsy1y2 < EPSILON && fabsy2y3 < EPSILON)
        throw new Error("Coincident points");

    if(fabsy1y2 < EPSILON) {
        m2  = -((x3 - x2) / (y3 - y2));
        mx2 = (x2 + x3) / 2.0;
        my2 = (y2 + y3) / 2.0;
        xc  = (x2 + x1) / 2.0;
        yc  = m2 * (xc - mx2) + my2;
    }

    else if(fabsy2y3 < EPSILON) {
        m1  = -((x2 - x1) / (y2 - y1));
        mx1 = (x1 + x2) / 2.0;
        my1 = (y1 + y2) / 2.0;
        xc  = (x3 + x2) / 2.0;
        yc  = m1 * (xc - mx1) + my1;
    }

    else {
        m1  = -((x2 - x1) / (y2 - y1));
        m2  = -((x3 - x2) / (y3 - y2));
        mx1 = (x1 + x2) / 2.0;
        mx2 = (x2 + x3) / 2.0;
        my1 = (y1 + y2) / 2.0;
        my2 = (y2 + y3) / 2.0;
        xc  = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2);
        yc  = (fabsy1y2 > fabsy2y3) ?
        m1 * (xc - mx1) + my1 :
        m2 * (xc - mx2) + my2;
    }

    dx = x2 - xc;
    dy = y2 - yc;
    return {i: i, j: j, k: k, x: xc, y: yc, r: dx * dx + dy * dy};
}

function dedup(edges) {
    var i, j, a, b, m, n;

    for(j = edges.length; j; ) {
        b = edges[--j];
        a = edges[--j];

        for(i = j; i; ) {
            n = edges[--i];
            m = edges[--i];

            if((a === m && b === n) || (a === n && b === m)) {
                edges.splice(j, 2);
                edges.splice(i, 2);
                break;
            }
        }
    }
}

function triangulate(vertices, key) {
    var n = vertices.length,
    i, j, indices, st, open, closed, edges, dx, dy, a, b, c;

    /* Bail if there aren't enough vertices to form any triangles. */
    if(n < 3)
        return [];

    /* Slice out the actual vertices from the passed objects. (Duplicate the
    * array even if we don't, though, since we need to make a supertriangle
    * later on!) */
    vertices = vertices.slice(0);

    if(key)
        for(i = n; i--; )
            vertices[i] = vertices[i][key];

    /* Make an array of indices into the vertex array, sorted by the
    * vertices' x-position. */
    indices = new Array(n);

    for(i = n; i--; )
        indices[i] = i;

    indices.sort(function(i, j) {
        return vertices[j][0] - vertices[i][0];
    });

    /* Next, find the vertices of the supertriangle (which contains all other
    * triangles), and append them onto the end of a (copy of) the vertex
    * array. */
    st = supertriangle(vertices);
    vertices.push(st[0], st[1], st[2]);

    /* Initialize the open list (containing the supertriangle and nothing
    * else) and the closed list (which is empty since we havn't processed
    * any triangles yet). */
    open   = [circumcircle(vertices, n + 0, n + 1, n + 2)];
    closed = [];
    edges  = [];

    /* Incrementally add each vertex to the mesh. */
    for(i = indices.length; i--; edges.length = 0) {
        c = indices[i];

        /* For each open triangle, check to see if the current point is
        * inside it's circumcircle. If it is, remove the triangle and add
        * it's edges to an edge list. */
        for(j = open.length; j--; ) {
            /* If this point is to the right of this triangle's circumcircle,
            * then this triangle should never get checked again. Remove it
            * from the open list, add it to the closed list, and skip. */
            dx = vertices[c][0] - open[j].x;
            if(dx > 0.0 && dx * dx > open[j].r) {
                closed.push(open[j]);
                open.splice(j, 1);
                continue;
            }

            /* If we're outside the circumcircle, skip this triangle. */
            dy = vertices[c][1] - open[j].y;
            if(dx * dx + dy * dy - open[j].r > EPSILON)
                continue;

            /* Remove the triangle and add it's edges to the edge list. */
            edges.push(
            open[j].i, open[j].j,
            open[j].j, open[j].k,
            open[j].k, open[j].i
            );
            open.splice(j, 1);
        }

        /* Remove any doubled edges. */
        dedup(edges);

        /* Add a new triangle for each edge. */
        for(j = edges.length; j; ) {
            b = edges[--j];
            a = edges[--j];
            open.push(circumcircle(vertices, a, b, c));
        }
    }

    /* Copy any remaining open triangles to the closed list, and then
    * remove any triangles that share a vertex with the supertriangle,
    * building a list of triplets that represent triangles. */
    for(i = open.length; i--; )
        closed.push(open[i]);
        open.length = 0;

    for(i = closed.length; i--; )
        if(closed[i].i < n && closed[i].j < n && closed[i].k < n)
            open.push(closed[i].i, closed[i].j, closed[i].k);

    /* Yay, we're done! */
    return open;
}

// End public domain code

// Map value
function map(x, inMin, inMax, outMin, outMax) {

    return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// Random int
function getRandomInt(min, max) {

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Average points
function averagePoints(points) {

    var sumX = 0;
    var sumY = 0;

    for (var i = 0; i < points.length; i++) {

        sumX += points[i][0];
        sumY += points[i][1];
    }

    return [sumX / points.length, sumY / points.length];
}

// Draw
function draw(ctx) {

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    points = getPoints(cellSize * imageScale, variation * imageScale, border * imageScale, ctx);
    drawImage(ctx);
}

// Draw the image
function drawImage(ctx) {

    triangles = triangulate(points, false);

    var convertedColors = [];

    for (var i = 0; i < paletteSize; i++) {

        convertedColors.push(chroma.hsl(colors[i][0], colors[i][1], colors[i][2]));
    }

    for (var i = 0; i < triangles.length; i += 3) {

        ctx.beginPath();
        ctx.moveTo(points[triangles[i]][0], points[triangles[i]][1]);
        ctx.lineTo(points[triangles[i + 1]][0], points[triangles[i + 1]][1]);
        ctx.lineTo(points[triangles[i + 2]][0], points[triangles[i + 2]][1]);

        var triangleCenter = averagePoints([points[triangles[i]], points[triangles[i + 1]], points[triangles[i + 2]]]);

        var x = triangleCenter[0];
        var y = triangleCenter[1];
        var normalizedX = map(x, 0, ctx.canvas.width, 0, 1);
        var normalizedY = map(y, 0, ctx.canvas.height, 0, 1);

        var scale = chroma.scale(convertedColors).mode("hcl");
        var colorIndex;

        if (colorMode == 0) {

            colorIndex = Math.hypot(normalizedX - 0.5, normalizedY - 0.5);

        } else if (colorMode == 1) {

            colorIndex = ((normalizedX + normalizedY) / 2);

        } else if (colorMode == 2) {

            colorIndex = ((1 - normalizedX + normalizedY) / 2);

        } else if (colorMode == 3) {

            colorIndex = normalizedX;

        } else if (colorMode == 4) {

            colorIndex = normalizedY;

        } else if (colorMode == 5) {

            colorIndex = map(PerlinNoise.noise(normalizedX * noiseScaleX, normalizedY * noiseScaleY, 0), 0.0, 1.0, 0, 1);

        } else if (colorMode == 6) {

            colorIndex = Math.hypot(normalizedX - 0.5, normalizedY - 1.5) - 0.5;
        }

        color = scale(colorIndex + (getRandomInt(0, 1) / (100 - colorVariation))).rgb();

        ctx.fillRGB(color[0], color[1], color[2]);
        ctx.strokeRGB(color[0], color[1], color[2]);
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
    }
}

// Get points
function getPoints(cellSize, randomness, border, ctx) {

    var points = [];

    for (var x = -border; x < ctx.canvas.width + border + cellSize; x += cellSize) {
        for (var y = -border; y < ctx.canvas.height + border + cellSize; y += cellSize) {
            points.push([x + getRandomInt(-randomness * cellSize, randomness * cellSize),
                         y + getRandomInt(-randomness * cellSize, randomness * cellSize)]);
        }
    }

    return points;
}

$("#cell-size").on("change", function() {
    cellSize = this.value;
    border = Math.round(0.2 * cellSize);
    draw(c);
});

$("#variation").on("change", function() {
    variation = this.value;
    draw(c);
});

$("#select-color-mode").on("change", function() {

    colorMode = this.value;

    if (colorMode == 4) $("#noise-controls").show();
    else $("#noise-controls").hide();

    drawImage(c);
});

$("#noise-scale-x").on("change mousemove touchmove", function() {
    noiseScaleX = this.value;
    drawImage(c);
});

$("#noise-scale-y").on("change mousemove touchmove", function() {
    noiseScaleY = this.value;
    drawImage(c);
});

$("#noise-randomize").click(function() {
    PerlinNoise.generate();
    drawImage(c);
});

$("#color-variation").on("change mousemove touchmove", function() {
    colorVariation = this.value;
    drawImage(c);
});

$("#select-colors").on("change", function() {
    paletteSize = this.value;
    updateControls();
    draw(c);
});

function updateControls() {

    for (var i = 0; i < maxPaletteSize; i++) {

        if (i < paletteSize) {

            $("#color-" + i).show();

            for (var j = 0; j < colorControls.length; j++) {
                $("#" + colorControls[j] + "-" + i).val(colors[i][j]);
            }

        } else {

            $("#color-" + i).hide();
        }
    }
}

$("#save-button").click(function(){

    $("#save-modal-container").fadeToggle(200);
});

$("#select-resolution").on("change", function(){

    if (this.value === 0) {

        setAutomaticResolution();

    } else {

        scaleFactor = +this.value.split("s")[1];
        if (scaleFactor > 0) imageScale = scaleFactor;
        rc.canvas.width = +this.value.split("s")[0].split("x")[0];
        rc.canvas.height = +this.value.split("s")[0].split("x")[1];
    }
});

function setAutomaticResolution() {

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {

        imageScale = 2;
        rc.canvas.width = 2732;
        rc.canvas.height = 2732;

    } else if (/Android/i.test(navigator.userAgent)) {

        imageScale = 2;
        rc.canvas.width = 2920;
        rc.canvas.height = 2560;

    } else {

        if (window.screen.width > 2560 || window.screen.height > 1600) {

            rc.canvas.width = 3840;
            rc.canvas.height = 2160;

        } else if (window.screen.width > 1920 || window.screen.height > 1200) {

            rc.canvas.width = 2560;
            rc.canvas.height = 1600;

        } else {

            rc.canvas.width = 1920;
            rc.canvas.height = 1200;
        }
    }
}

$("#final-save-button").click(function(){

    $("#save-modal-container").fadeToggle(200);

    draw(rc);

    // Convert image to blob
    $("#final-save-button").attr("href", rc.canvas.toDataURL("image/jpg"));
    $("#final-save-button").attr("download", "wallpaper.jpg");
});

$(".modal-close-button").click(function(event) {

    $(event.target).parent().parent().parent().fadeToggle(200);
});

// Start here
// Get canvas 2d context to draw on
var c = document.getElementById("canvas").getContext("2d");
var rc = document.getElementById("renderCanvas").getContext("2d"); // Rendering canvas

var width, height;

// Device pixel ratio
var devicePixelRatio = +window.devicePixelRatio || (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) ? 2 : 1;
var imageScale = devicePixelRatio;

var cellSize = 35;
var variation = 0.075;
var colorMode = 1;
var noiseScaleX = 1;
var noiseScaleY = 1;
var colorVariation = 20;
var border = 10;
var points;
var colorControls = ["hue", "saturation", "lightness"];
var paletteSize = 2;
var maxPaletteSize = 5;
var colors = [chroma("#efee69").hsl(), chroma("#21313e").hsl(), chroma("#212121").hsl(), chroma("#212121").hsl(), chroma("#212121").hsl()];

window.onload = function() {

    // Set up canvas
    width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    c.canvas.width = width;
    c.canvas.height = height;

    // Setup
    for (var i = 0; i < maxPaletteSize; i++) {
        for (var j = 0; j < colorControls.length; j++) {
            var eventFunction = new Function("colors[" + i + "][" + j + "] = parseFloat(this.value);drawImage(c);");
            $("#" + colorControls[j] + "-" + i).on("change mousemove touchmove", eventFunction);
        }
    }

    updateControls();
    setAutomaticResolution();

    // Draw image
    draw(c);
};
