const mappakey = 'pk.eyJ1IjoiY2Fpcm9sZWluIiwiYSI6ImNraW5jZXl2NDBuZ3YycHAzemtudjZlZTYifQ.m10BNeMIqNZAJ7wZhYdm6A';
const mappa = new Mappa('MapboxGL', mappakey);
const version = "21";
let myMap;
let canvas;
let myFont;


// Options for map
const options = {
  lat: 53.0793, // center in bremen
  lng: 8.8017,
  zoom: 6,
  style: 'mapbox://styles/mapbox/dark-v9',
  pitch: 0,
};

let uid = gen_uid(); // unique brower/user id wird als db key benutze...
let name = "-"; // player name
let direction = -1; // wohin wird gekucked
let lat = -1; // wo bin ich
let long = -1;
let partnerKey = '-';
var database; // db ref
var players; // liste alle spieler

function preload() {
  myFont = loadFont('Ligconsolata-Regular.otf');
}


function setup() {
  // canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas = createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  textFont(myFont, 20);
  textSize(20);
  watchPosition(positionChanged); // gps callback

  var firebaseConfig = {
    apiKey: "AIzaSyAHhemIVPZOX5wzRYJG7tRxjile83EiLYk",
    authDomain: "catchingbutterflies-e5e34.firebaseapp.com",
    databaseURL: "https://catchingbutterflies-e5e34-default-rtdb.firebaseio.com",
    projectId: "catchingbutterflies-e5e34",
    storageBucket: "catchingbutterflies-e5e34.appspot.com",
    messagingSenderId: "71925730987",
    appId: "1:71925730987:web:653c3bce55b035cc10f1ee",
    measurementId: "G-HS69VY7SRS"
  }
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  console.log(firebase);
  console.log('uid:' + uid);
  database = firebase.database();

  // eingebefeld für den namen
  name = createInput();
  name.position(120, 30);
  name.value(getItem('demoName')); // holt namen aus coookie
   
  // eingabefeld für den PartnerKey
  partnerKey = createInput();
  partnerKey.position(120, 60);
  partnerKey.value(int(random(0,1000)));
  

  maintenancePlayerData();
  updatePlayerData();
  getAllPlayerData();
  setInterval(updateData, 2000); // daten mit server abgleichen

  myMap = mappa.tileMap(options);
  myMap.overlay(canvas);
  // myMap.onChange(drawPlayer);
}


function draw() {
  drawPlayer();
  fill(255, 181, 2197);
  text("your name", 20, 45);
  fill(191, 239, 255);
  text("Key", 20, 75);
  /*drawGui();*/
}


function drawPlayer() {
  clear();

  push();
  var mypos = myMap.latLngToPixel(lat, long);
  size = map(myMap.zoom(), 1, 6, 5, 7);
  noStroke();
  fill(255, 0, 255);
  ellipse(mypos.x, mypos.y, size, size);
  fill(255);
  text(name.value(), mypos.x+5, mypos.y);
  if (rotationZ != null) {
    stroke(255, 0, 255);
    fill(255, 0, 255);
    let dirvec = createVector((cos(rotationZ) * (size * 10)), (sin(rotationZ) * (size * 10)));
    /*drawArrow(createVector(mypos.x, mypos.y), dirvec, 255);*/
  }
  if (players != null) {
    var keys = Object.keys(players);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      // console.log("Key: " + k + "   lat: " + players[k].lat + "   Name: " + players[k].long);
      if (k != uid) {
        // not myself
        var pos = myMap.latLngToPixel(players[k].lat, players[k].long);
        size = map(myMap.zoom(), 1, 6, 5, 7);
        noStroke();
        fill(0, 255, 255)
        ellipse(pos.x, pos.y, size, size);
        fill(255);
        text(players[k].name, pos.x + 5, pos.y);
        stroke(0, 255, 255);
        fill(0, 255, 255);
        if (players[k].direction != "") {
          let dirvec = createVector((cos(players[k].direction) * (size * 10)), (sin(players[k].direction) * (size * 10)));
          /*drawArrow(createVector(pos.x, pos.y), dirvec, 255);*/
        }
        stroke(255);
        for (var j = 0; j < keys.length; j++) {
          var ko = keys[j];
          if (ko != k) { // selfcheck
            var pos_other = myMap.latLngToPixel(players[ko].lat, players[ko].long);
            /*line(pos.x, pos.y, pos_other.x, pos_other.y);*/      
            if(partnerKey.value() == players[ko].partnerKey){
              line(mypos.x, mypos.y, pos_other.x, pos_other.y);
            }
            
          }
        }
      }
    }
  }

  pop();
}

/*function drawArrow(base, vec, myColor) {
  push();
  translate(base.x, base.y);
  line(0, 0, vec.x, vec.y);
  rotate(vec.heading());
  let arrowSize = 8;
  translate(vec.mag() - arrowSize, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}*/

/*function drawGui() {
  textSize(15);
  fill(0);
  noStroke();
  rect(0, (windowHeight * 0.90), windowWidth, windowHeight);
  noStroke();
  fill(255);
  var info = "version = " + version + "\ndirection = " + rotationZ + "\n";
  if (geoCheck() == true) {
    info += 'lat = ' + lat + '\nlong = ' + long;
  } else {
    info += 'no geo';
  }
  text(info, 30, (windowHeight * 0.90) + 20);
  stroke(0, 255, 0);
}*/

function updateData() {
  updatePlayerData(); // meine daten updaten
  maintenancePlayerData(); // kill all zombies
  getAllPlayerData(); // alle anders player daten holen
  storeItem('demoName', name.value()); // meinen player namen im coookie speichern
}

function getAllPlayerData() {
  var ref = database.ref("player");
  ref.on("value", gotData, errData);
}

function errData(data) {
  // nop
}

function gotData(data) {
  players = data.val();
}

function positionChanged(position) {
  lat = position.latitude;
  long = position.longitude;
}

function maintenancePlayerData() {
  var ref = firebase.database().ref('player');
  var now = Date.now();
  var cutoff = now - 20 * 1000; // 20 sekunden.
  var old = ref.orderByChild('timestamp').endAt(cutoff).limitToLast(1);
  var listener = old.on('child_added', function (snapshot) {
    snapshot.ref.remove();
  });
}

function updatePlayerData() {
  if (rotationZ != null) {
    direction = rotationZ;
  } else {
    direction = ""; // no gps
  }
  firebase.database().ref('player/' + uid).set({
    lat: lat,
    long: long,
    direction: direction,
    name: name.value(),
    partnerKey: partnerKey.value(),
    timestamp: Date.now()
  });
}



function gen_uid() {
  /*
   erzeuge eine user id anhänig von bildschirmaufläsung; browser id, etc....
   https://pixelprivacy.com/resources/browser-fingerprinting/
   https://en.wikipedia.org/wiki/Device_fingerprint
  */
  var navigator_info = window.navigator;
  var screen_info = window.screen;
  var uid = navigator_info.mimeTypes.length;
  uid += navigator_info.userAgent.replace(/\D+/g, '');
  uid += navigator_info.plugins.length;
  uid += screen_info.height || '';
  uid += screen_info.width || '';
  uid += screen_info.pixelDepth || '';
  return uid;
}