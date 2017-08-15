// 3-dimensional perlin noise
// Author: jackw01 (https://github.com/jackw01)
// Created 2017-07-08
// This code is in the public domain

var PerlinNoise = {};

PerlinNoise.generate = function() {

    this.permutation = [];
    for (var i = 0; i < 256; i++) this.permutation.push(i);

    var currentIndex = this.permutation.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {

        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = this.permutation[currentIndex];
        this.permutation[currentIndex] = this.permutation[randomIndex];
        this.permutation[randomIndex] = temporaryValue;
    }

    for (var i = 0; i < 256; i++) this.permutation.push(this.permutation[i]);
}

PerlinNoise.fade = function(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

PerlinNoise.lerp = function(t, a, b) { return a + t * (b - a); }

PerlinNoise.grad = function(hash, x, y, z) {

    var h = hash & 15;
    var u = h < 8 ? x : y,
    v = h < 4 ? y : h == 12 || h == 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

PerlinNoise.noise = function(x, y, z) {

    var X = Math.floor(x) & 255,
        Y = Math.floor(y) & 255,
        Z = Math.floor(z) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

    var u = this.fade(x),
        v = this.fade(y),
        w = this.fade(z);

    var A = this.permutation[X] + Y,
        AA = this.permutation[A] + Z,
        AB = this.permutation[A + 1] + Z,
        B = this.permutation[X + 1] + Y,
        BA = this.permutation[B] + Z,
        BB = this.permutation[B + 1] + Z;

    return (this.lerp(w, this.lerp(v, this.lerp(u,this. grad(this.permutation[AA], x, y, z),
            this.grad(this.permutation[BA], x - 1, y, z)),
            this.lerp(u, this.grad(this.permutation[AB], x, y - 1, z),
            this.grad(this.permutation[BB], x - 1, y - 1, z))),
            this.lerp(v, this.lerp(u, this.grad(this.permutation[AA + 1], x, y, z - 1),
            this.grad(this.permutation[BA + 1], x - 1, y, z - 1)),
            this.lerp(u, this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
            this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1))))) + 0.5;
};

PerlinNoise.generate();
