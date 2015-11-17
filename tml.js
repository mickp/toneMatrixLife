// Conway's game of life + tone matrix.
// Copyright Mick Phillips, 2015.
var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");

var pOccupied = 0.1;
var size = 16;
var runFlag = 0;
var beatsPerCycle = 4;
var matrix = new Array(size);
var neighbours = new Array(size);
var beat = 0;
var timer;
var bpm = 200;
var rSize = 20;
var rPad = 6;
var x0 = 4
var y0 = 4

function Site(i, j) {
    this.name = name;

    this.position = {
      beat: i,
      pitch: j,
    };

    this.nnCount = 0;

    this.rect = {
      x: null,
      y: null,
    }
  };


Site.prototype = {
  draw: function() {
    this.rect.x = this.position.beat * (rSize+rPad);
    this.rect.y = this.position.pitch * (rSize+rPad);
    context.fillStyle = this.state ? '#00e' : '#eee';
    context.fillRect(x0 + this.rect.x, y0 + this.rect.y, rSize, rSize);
  },

  iterate: function () {
    if (this.state) {
      if (this.nnCount < 2 || this.nnCount > 3) {
        this.state = false;
      }
    } else if (this.nnCount == 3) {
      this.state = true;
    }
  },

  toggle: function() {
    this.state = !this.state;
  },

  onClick: function(x, y) {
    if (x > this.rect.x && x <= this.rect.x + rSize && y > this.rect.y && y < this.rect.y + rSize) {
      this.toggle();
      this.draw();
    }
  }
};


for (var i=0; i<matrix.length; i++) {
 matrix[i] = new Array(size);
 neighbours[i] = new Array(size);
 for (var j=0;j<matrix[i].length; j++) {
   matrix[i][j] = new Site(i, j);
   matrix[i][j].state = Math.random() <= pOccupied;
   neighbours[i][j] = new Array(0);
  }
}

generate();

for (var i=0; i<matrix.length; i++) {
  for (var j=0; j<matrix[i].length; j++) {
    for (var m=i-1; m<=i+1; m++){
      for (var n=j-1; n<=j+1; n++) {
        var p, q;
        // if (m>=0 && n>=0 && m<size && n<size && !(m==i && n==j)) {
        //  neighbours[i][j].push(matrix[m][n]);
        if (m < 0) {
          p = matrix.length - 1;
        } else if (m >= matrix.length) {
          p = 0;
        } else {
          p = m;
        }
        if (n < 0) {
          q = matrix[i].length - 1;
        } else if (n >= matrix[i].length) {
          q = 0;
        } else {
          q = n;
        }
        if (!(m == i && n == j)) {
          neighbours[i][j].push(matrix[p][q]);
        }
      }
    }
  }
}

//Note	Major	Minor
//1	1	1
//2	9/8	6/5
//3	5/4	4/3
//4	3/2	3/2
//5	5/3	9/5
//6	2	2

baseFreq = 220;
freqRatios = [1, 9/8, 5/4, 3/2, 5/3,
              2, 18/8, 10/4, 6/2, 10/3,
              4, 27/8, 20/4, 12/2, 20/3,
              6].reverse();

var acxt = new AudioContext();
oscs = [];
amps = [];
for (var i=0; i<freqRatios.length; i++) {
  // Oscillator
  oscs.push(acxt.createOscillator());
  oscs[i].type='sine';
  oscs[i].frequency.value = baseFreq * freqRatios[i];
  oscs[i].start(0);
  // Gain
  amps.push(acxt.createGain());
  amps[i].gain.value=0;
  // Connections
  oscs[i].connect(amps[i]);
  amps[i].connect(acxt.destination);
}

draw();


canvas.addEventListener('click', function(event) {
    lastE = event;
    var x = event.pageX - canvas.offsetLeft,
        y = event.pageY - canvas.offsetTop;
    matrix.forEach(function(row){
      row.forEach(function(site){
        site.onClick(x,y);
      })
    })
  })


function generate() {
  var wasRunning = false;
  if (runFlag) {
    playPause();
    wasRunning = true;
  }
  for (i=0; i<matrix.length; i++) {
    for (j=0; j<matrix[i].length; j++) {
      matrix[i][j].state = Math.random() <= pOccupied;
    }
  }
  draw();
  if (wasRunning) {
    playPause();
  }
}

function run() {
   draw();
   for (var i=0; i<matrix[beat].length; i++) {
     if (runFlag == 1 && matrix[beat][i].state) {
       amps[i].gain.value = 1;
     } else {
       amps[i].gain.value = 0;
       window.clearTimeout(timer);
     }
   }
   if (runFlag == 1) {
     timer = window.setTimeout(run, 60000/bpm);
   }
   if (beat % beatsPerCycle == 0) {
      iterate();
   }
   beat += 1;
   if (beat >= matrix.length) {
     beat = 0;
   }
 }

function iterate() {
 // Any live cell with fewer than two live neighbours dies, as if caused by under-population.
 // Any live cell with two or three live neighbours lives on to the next generation.
 // Any live cell with more than three live neighbours dies, as if by over-population.
 // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
 for (var row=0; row<matrix.length; row++) {
   for (var col=0; col<matrix[row].length; col++) {
     matrix[row][col].nnCount = 0;
     for (n in neighbours[row][col]) {
       if (neighbours[row][col][n].state) {
         matrix[row][col].nnCount += 1;
       }
     }
   }
 }
 for (row in matrix) {
   for (col in matrix[row]) {
    matrix[row][col].iterate();
  }
 }
}


function draw() {
  canvas.width = size*(rPad + rSize) + rPad
  canvas.height = size*(rPad + rSize) + rPad
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffd";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = '#000';
  for (var i=0; i<size; i++) {
    for (var j=0; j<size; j++) {
      matrix[i][j].draw(x0, y0, rSize, rPad);
    }
    context.lineWidth="2";
    context.strokeRect(beat*(rSize+rPad)+rPad/2, 0, rSize, canvas.height)
    context.lineWidth="0";
  }
}


function playPause() {
  if (runFlag) {
    runFlag = 0;
  } else {
    runFlag = 1;
    run();
  }
}


function updateValue(ctrl) {
  window[ctrl.id] = ctrl.value
}
