/*
Triangulator
Copyright (C) 2015-2016 jackw01

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
        throw new Error("Eek! Coincident points!");

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

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

// End public domain code

// Port of Ken Perlin's code

var PerlinNoise = {};

PerlinNoise.randomInts = [];

for (var i = 0; i < 256; i++) {

    PerlinNoise.randomInts.push(getRandomInt(0, 256));
}

PerlinNoise.noise = function(x, y, z) {

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

    function lerp(t, a, b) { return a + t * (b - a); }

    function grad(hash, x, y, z) {
        var h = hash & 15;
        var u = h < 8 ? x : y,
        v = h < 4 ? y : h == 12 || h == 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    function scale(n) { return (1 + n) / 2; }

    var p = new Array(512);

    for (var i = 0; i < 256; i++)
        p[256 + i] = p[i] = this.randomInts[i];

    var X = Math.floor(x) & 255,
        Y = Math.floor(y) & 255,
        Z = Math.floor(z) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

    var u = fade(x),
        v = fade(y),
        w = fade(z);

    var A = p[X] + Y,
        AA = p[A] + Z,
        AB = p[A + 1] + Z,
        B = p[X + 1] + Y,
        BA = p[B] + Z,
        BB = p[B + 1] + Z;

    return scale(lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z),
                 grad(p[BA], x - 1, y, z)),
                 lerp(u, grad(p[AB], x, y - 1, z),
                 grad(p[BB], x - 1, y - 1, z))),
                 lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1),
                 grad(p[BA + 1], x - 1, y, z - 1)),
                 lerp(u, grad(p[AB + 1], x, y - 1, z - 1),
                 grad(p[BB + 1], x - 1, y - 1, z - 1)))));
};

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

    points = getPoints(cellSize * ppx, variation * ppx, border * ppx, ctx);
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
        var color;

        if (colorMode === 0) {

            color = chroma.interpolate(scale(normalizedX + (getRandomInt(0, 1) / (100 - colorVariation))),
                                       scale(normalizedY + (getRandomInt(0, 1) / (100 - colorVariation))),
                                       0.5).rgb();

        } else if (colorMode == 1) {

            color = scale(((normalizedX + normalizedY) / 2) + (getRandomInt(0, 1) / (100 - colorVariation))).rgb();

        } else if (colorMode == 2) {

            color = scale(normalizedX + (getRandomInt(0, 1) / (100 - colorVariation))).rgb();

        } else if (colorMode == 3) {

            color = scale(normalizedY + (getRandomInt(0, 1) / (100 - colorVariation))).rgb();

        } else if (colorMode == 4) {

            color = scale(map(PerlinNoise.noise(normalizedX * noiseScaleX, normalizedY * noiseScaleY, 0) + (getRandomInt(0, 1) / (100 - colorVariation)),0.1, 0.9, 0, 1)).rgb();

        } else if (colorMode == 5) {



        }

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

    if (colorMode == 4) {

        $("#noise-controls").show();

    } else {

        $("#noise-controls").hide();
    }

    draw(c);
});

$("#noise-scale-x").on("change mousemove touchmove", function() {

    noiseScaleX = this.value;

    draw(c);
});

$("#noise-scale-y").on("change mousemove touchmove", function() {

    noiseScaleY = this.value;

    draw(c);
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

$("#randomize-button").click(function(){

    colors = [];

    var hue1 = getRandomInt(0, 360);
    var hue2 = (hue1 + getRandomInt(50, 260)) % 360;
    var saturation1 = 0.8;
    var saturation2 = 0.8;
    var lightness1 = 0.5;
    var lightness2 = 0.5;

    var colorCombination = getRandomInt(0, 1);

    if (colorCombination === 0) {

        saturation2 = 0.2;
        lightness2 = 0.2;

    } else if (colorCombination == 1) {

        lightness2 = 0.2;
    }

    colors.push(chroma.hsl(hue1, saturation1, lightness1).hsl());
    colors.push(chroma.hsl(hue2, saturation2, lightness2).hsl());

    drawImage(c);
    updateControls();
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

    } else if (this.value == 1) {

        setResolution(1024, 768);

    } else if (this.value == 2) {

        setResolution(1280, 800);

    } else if (this.value == 3) {

        setResolution(1366, 768);

    } else if (this.value == 4) {

        setResolution(1680, 1050);

    } else if (this.value == 5) {

        setResolution(1920, 1080);

    } else if (this.value == 6) {

        setResolution(1920, 1200);

    } else if (this.value == 7) {

        setResolution(2560, 1440);

    } else if (this.value == 8) {

        setResolution(2560, 1600);

    } else if (this.value == 9) {

        setResolution(3840, 2160);

    } else if (this.value == 10) {

        setIOSResolution();

    } else if (this.value == 11) {

        setAndroidLargeResolution();

    } else if (this.value == 12) {

        setAndroidSmallResolution();
    }
});

function setAutomaticResolution() {

    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {

        setIOSResolution();

    } else if (/Android/i.test(navigator.userAgent)) {

        if (height >= 1280) {

            setAndroidLargeResolution();

        } else {

            setAndroidSmallResolution();
        }

    } else {

        rc.canvas.width = window.screen.width;
        rc.canvas.height = window.screen.height;

        $("#automatic-size").html("Wallpaper will be saved for your device (" + window.screen.width + "x" + window.screen.height + " pixels).");
    }
}

function setIOSResolution() {

    ppx = 2;

    rc.canvas.width = 2732;
    rc.canvas.height = 2732;

    $("#automatic-size").html("Wallpaper will be saved for iPad/iPhone (2732x2732 pixels).");
}

function setAndroidLargeResolution() {

    ppx = 2;

    rc.canvas.width = 2920;
    rc.canvas.height = 2560;

    $("#automatic-size").html("Wallpaper will be saved for large Android devices (2920x2560 pixels).");
}

function setAndroidSmallResolution() {

    ppx = 2;

    rc.canvas.width = 1460;
    rc.canvas.height = 1280;

    $("#automatic-size").html("Wallpaper will be saved for small Android devices (1460x1280 pixels).");
}

function setResolution(w, h) {

    rc.canvas.width = w;
    rc.canvas.height = h;

    $("#automatic-size").html("Wallpaper will be saved at a resolution of " + w + "x" + h + " pixels.");
}

$("#final-save-button").click(function(){

    $("#save-modal-container").fadeToggle(200);

    draw(rc);

    // Convert image to blob
    $("#final-save-button").attr("href", rc.canvas.toDataURL("image/jpg"));
    $("#final-save-button").attr("download", "wallpaper.jpg");
});

// Start here
// Get canvas 2d context to draw on
var c = document.getElementById("canvas").getContext("2d");
var rc = document.getElementById("renderCanvas").getContext("2d"); // Rendering canvas

var width, height;

var dppx = +window.devicePixelRatio || Math.sqrt(screen.deviceXDPI * screen.deviceYDPI) / 96 || 1;
var ppx = dppx;

var cellSize = 30;
var variation = 0.2;
var colorMode = 1;
var noiseScaleX = 1;
var noiseScaleY = 1;
var colorVariation = 20;
var border = 10;
var points;
var colorControls = ["hue", "saturation", "lightness"];
var paletteSize = 2;
var maxPaletteSize = 5;
var colors = [];

colors.push(chroma("#efee69").hsl());
colors.push(chroma("#21313e").hsl());
colors.push(chroma("#212121").hsl());
colors.push(chroma("#212121").hsl());
colors.push(chroma("#212121").hsl());

for (var i = 0; i < maxPaletteSize; i++) {

    for (var j = 0; j < colorControls.length; j++) {

        var eventFunction = new Function("colors[" + i + "][" + j + "] = parseFloat(this.value);drawImage(c);");

        $("#" + colorControls[j] + "-" + i).on("change mousemove touchmove", eventFunction);
    }
}

updateControls();

window.onload = function() {

    // Set up canvas
    width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    c.canvas.width = width;
    c.canvas.height = height;

    // Setup
    setAutomaticResolution();

    // Draw image
    draw(c);
};
