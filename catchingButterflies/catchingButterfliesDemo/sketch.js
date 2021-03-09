 
var mappakey = 'pk.eyJ1IjoiY2Fpcm9sZWluIiwiYSI6ImNraW5jZXl2NDBuZ3YycHAzemtudjZlZTYifQ.m10BNeMIqNZAJ7wZhYdm6A';
var mappa = new Mappa('MapboxGL', mappakey);
const version = "21";
let myMap;
let canvas;
let myFont;
let butterflies = [];

var uid = gen_uid(); // unique brower/user id wird als db key benutze...
let name = "-"; // player name
let lat = -1; // wo bin ich
let long = -1;

var database; // db ref
var players; // liste alle spieler
var request = null;
var idPartner = 'none';
var netBoolean = false;
let button;
var spawnCoords = [{lat: 53.07462, lng: 8.80843}, {lat: 52.98225, lng: 8.84977}];
var score = 0;





// Designs der Map
const options = {
  
  lat: 53.0793, // center in bremen
  lng: 8.8017,
  zoom: 10,
    style: 'mapbox://styles/cairolein/ckioqp3h451ap18l3ws9ec3us',
  pitch: 0,
  
};


// Schriftart wird geladen
function preload() {
  myFont = loadFont('AlohaSummer.otf'); 
}

//Vorbereitung der Leindwand
function setup() {
  noCanvas();
  canvas = createCanvas(windowWidth, windowHeight); 
  textFont(myFont, 35); //Schriftart auf Leinwand laden
  textSize(35); //Schriftgröße
  img = loadImage('butter.png');
  watchPosition(positionChanged); // gps callback


  button = createButton('Delete Connection');
  button.position((windowWidth-(windowWidth-15)),(windowHeight-(windowHeight-90)));
  button.mousePressed(reset);


  var firebaseConfig = { //Multiplayerfunktion
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

 //if( getItem('latitude') != undefined || getItem('longitude') != undefined){
  // lat = parseFloat(getItem('latitude'));
   //long = paseFloat(getItem('longitude'));
   //options.lat = lat;
  // options.lng = long;
 //}


  

  // eingebefeld für den Namen
  name = createInput();
  name.position((windowWidth-(windowWidth-15)), (windowHeight-(windowHeight-60)));
  name.value(getItem('demoName')); // holt namen aus coookie
  var radius = 0.5;
  Math.seedrandom("CatchingButterflies"+ day() + month() + year());

  for(let i = 0; i < spawnCoords.length; i++){
    for(let butterflyCount = 0; butterflyCount<300; butterflyCount++){
      var c = {lat:spawnCoords[i].lat+(Math.random())*radius*0.3, lng: spawnCoords[i].lng+(Math.random()-0.6)*radius};
      butterflies.push(new Butterflies(c));
    }
  }
  
    myMap = mappa.tileMap(options); 
    myMap.overlay(canvas);//MapBox Karte wird auf die Leinwand gelegt.
    myMap.onChange(drawPlayer);
    myMap.onChange(drawButterflies);
    myMap.onChange(textDraw);

  
  maintenancePlayerData();
  updatePlayerData();
  getAllPlayerData();
  setInterval(updateData, 2000); // daten mit server abgleichen
 
}

function reset(){
  idPartner = 'none';
  netBoolean = false;
}

function draw() { // Spieler und Schriften werden auf die Leinwand gezeichnet
  drawPlayer();
  drawButterflies();
  textDraw();
}

function textDraw(){ //Schriften 
  fill(255, 105, 180);
  text("your Name", (windowWidth-(windowWidth-15)), (windowHeight-(windowHeight-50)));
  fill(84, 139, 84,200);
  fill(137, 104, 205);
  text("Your Score: " + score, (windowWidth-(windowWidth-15)), (windowHeight-(windowHeight-140)));
}

function drawButterflies(){
  for(let i = 0; i < butterflies.length; i++){
   butterflies[i].move();
    butterflies[i].display();
    if ( butterflies[i].dead){
      butterflies.splice(i, 1)
    }
  }
}



function drawPlayer() { //Spieler implementieren
  
  clear();
  

  push();

  var mypos = myMap.latLngToPixel(lat, long);
  size = map(myMap.zoom(), 1, 6, 5, 7);
  noStroke();
  fill(255, 105, 180);
  ellipse(mypos.x, mypos.y, size, size);
  fill(255, 105, 180);
  text(name.value(), mypos.x+5, mypos.y);
  
  if (players != null) {
    var keys = Object.keys(players);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      // console.log("Key: " + k + "   lat: " + players[k].lat + "   Name: " + players[k].long);
      if (k != uid) {
        // not myself      
        var pos = myMap.latLngToPixel(players[k].lat, players[k].long);
        size = map(myMap.zoom(), 1, 6, 5, 7);
      
            if(players[k].netBoolean){
                noStroke();
              fill(106, 90, 205);
              ellipse(pos.x, pos.y, size, size);
              fill(106, 90, 205);
              text(players[k].name, pos.x + 5, pos.y);
            
            }else{
              noStroke();
              fill(121, 205, 205);
              ellipse(pos.x, pos.y, size, size);
              fill(121, 205, 205);
              text(players[k].name, pos.x + 5, pos.y);
            }
        
        for (var j = 0; j < keys.length; j++) {
          var ko = keys[j];
          if (ko != k) { // selfcheck
            var pos_other = myMap.latLngToPixel(players[ko].lat, players[ko].long); 
            
                if((players[ko].idPartner == uid && !netBoolean && idPartner == 'none' )
                      ||( players[ko].idPartner == 'none' && !players[ko].netBoolean && idPartner == players[ko].uid)){
                  stroke(193, 205, 205,200);             
                  line(mypos.x, mypos.y, pos_other.x, pos_other.y);
                }else if(players[ko].idPartner == uid && idPartner == players[ko].uid){
                       idPartner = players[ko].uid;
                        stroke(137, 104, 205,200);
                        line(mypos.x, mypos.y, pos_other.x, pos_other.y); 
                        for(var b = 0; b < butterflies.length; b++){
                          butterflies[b].checkCollision(mypos,pos_other);

                        }                         
                     }
                     else if (idPartner == players[ko].uid && players[ko].idPartner != 'none' && players[ko].idPartner != uid){
                      reset();
                      alert("Your connection to " + players[ko].name + "has been deleted. " + players[ko].name + " found somebody else to play with...");
                     }                   
 
          }
        }
      }
    }
  }
  pop();
  
}

function mouseReleased(){
  if(idPartner == 'none'){
  if (players != null) {
  var keys = Object.keys(players);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k != uid) {
          for (var j = 0; j < keys.length; j++) {
            var ko = keys[j];
            if (ko != k) { // selfcheck
              var pos_other = myMap.latLngToPixel(players[ko].lat, players[ko].long);
              if(abs(pos_other.x-mouseX)<20 && abs(pos_other.y-mouseY)<20){           
                  idPartner = players[ko].uid;        
                  alert("You tried to connect to " + players[ko].name);
                  netBoolean = true;       
                
               }
                
             }
            }
          }
       }
     }
    }
  }

function updateData() {
  updatePlayerData(); // meine daten updaten
  maintenancePlayerData(); // afk Spieler entfernen
  getAllPlayerData(); // alle anders player daten holen
  storeItem('demoName', name.value()); // meinen player namen im coookie speichern
}

function getAllPlayerData() {
  var ref = database.ref("player");
  ref.on("value", gotData, errData);
}

function getAllButterfliesData(){
  var ref = database.ref('butterflies');
  ref.on("value", gotDataButterflies, errData);
}

function errData(data) {
  // nop
}

function gotData(data) {
  players = data.val();
}
function gotDataButterflies(data){
  butterflies = data.val();
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

function updateButterfliesToServer(){
  for(let i = 0; i < butterflies.length; i++){
    var position = myMap.pixelToLatLng(butterflies[i].x, butterflies[i].y)
      firebase.database().ref('butterflies/' + butterflies[i].id).set({
        lat: position.latitude,
        long: position.longitude,
        timestamp: Date.now()
      });
    }
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
    timestamp: Date.now(),
    request: request,
    idPartner: idPartner,  
    uid: uid,
    netBoolean: netBoolean,
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

class Butterflies{
  
 //Schmetterlinge-Klasse
  constructor(coords){
    this.id = "S"+ int(random(100000000));
    this.dead = false;
    this.birthtime = millis();
    this.lng = coords.lng;
    this.lat = coords.lat;
    this.x = 0;
    this.y = 0;
    this.maxAge = random(5000, 15000);
    this.diameter = 35;
  }

  move(){
    var coord = myMap.latLngToPixel(this.lat, this.lng);
    this.x = coord.x + random(-1,1); //(this.x * (1-speed)) + (this.targetx * speed);
    this.y = coord.y + random(-1,1); //(this.y * (1-speed)) + (this.targety * speed);
  }

  display(){       
   if(!this.dead){
      image(img, this.x-this.diameter/2, this.y-this.diameter/2, this.diameter, this.diameter);
    }
 }


 checkCollision(mypos,pos_other){
  var pointonline = getClosestPointOnLines({x:this.x,y:this.y},[mypos,pos_other]);
  var geoPoint = myMap.pixelToLatLng(pointonline.x, pointonline.y);
  var dist = GeoDistanceInMeter(geoPoint.lat,geoPoint.lng,this.lat, this.lng);
  console.log(dist);
  if(dist<8 && this.dead == false){
    this.dead = true;
    score += 1;
  }
 }
}

/* desc Static function. Find point on lines nearest test point
   test point pXy with properties .x and .y
   lines defined by array aXys with nodes having properties .x and .y 
   return is object with .x and .y properties and property i indicating nearest segment in aXys 
   and property fFrom the fractional distance of the returned point from aXy[i-1]
   and property fTo the fractional distance of the returned point from aXy[i]   */


   function getClosestPointOnLines(pXy, aXys) {

    var minDist;
    var fTo;
    var fFrom;
    var x;
    var y;
    var i;
    var dist;

    if (aXys.length > 1) {

        for (var n = 1 ; n < aXys.length ; n++) {

            if (aXys[n].x != aXys[n - 1].x) {
                var a = (aXys[n].y - aXys[n - 1].y) / (aXys[n].x - aXys[n - 1].x);
                var b = aXys[n].y - a * aXys[n].x;
                dist = Math.abs(a * pXy.x + b - pXy.y) / Math.sqrt(a * a + 1);
            }
            else
                dist = Math.abs(pXy.x - aXys[n].x)

            // length^2 of line segment 
            var rl2 = Math.pow(aXys[n].y - aXys[n - 1].y, 2) + Math.pow(aXys[n].x - aXys[n - 1].x, 2);

            // distance^2 of pt to end line segment
            var ln2 = Math.pow(aXys[n].y - pXy.y, 2) + Math.pow(aXys[n].x - pXy.x, 2);

            // distance^2 of pt to begin line segment
            var lnm12 = Math.pow(aXys[n - 1].y - pXy.y, 2) + Math.pow(aXys[n - 1].x - pXy.x, 2);

            // minimum distance^2 of pt to infinite line
            var dist2 = Math.pow(dist, 2);

            // calculated length^2 of line segment
            var calcrl2 = ln2 - dist2 + lnm12 - dist2;

            // redefine minimum distance to line segment (not infinite line) if necessary
            if (calcrl2 > rl2)
                dist = Math.sqrt(Math.min(ln2, lnm12));

            if ((minDist == null) || (minDist > dist)) {
                if (calcrl2 > rl2) {
                    if (lnm12 < ln2) {
                        fTo = 0;//nearer to previous point
                        fFrom = 1;
                    }
                    else {
                        fFrom = 0;//nearer to current point
                        fTo = 1;
                    }
                }
                else {
                    // perpendicular from point intersects line segment
                    fTo = ((Math.sqrt(lnm12 - dist2)) / Math.sqrt(rl2));
                    fFrom = ((Math.sqrt(ln2 - dist2)) / Math.sqrt(rl2));
                }
                minDist = dist;
                i = n;
            }
        }

        var dx = aXys[i - 1].x - aXys[i].x;
        var dy = aXys[i - 1].y - aXys[i].y;

        x = aXys[i - 1].x - (dx * fTo);
        y = aXys[i - 1].y - (dy * fTo);

    }

    return { 'x': x, 'y': y, 'i': i, 'fTo': fTo, 'fFrom': fFrom };
}

const EARTH_RADIUS = 6378137;

function GeoDistanceInMeter(lat1, lon1, lat2, lon2) {
    //const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI / 180; // phi, lamda in radians
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    //return R * c; // in metres
    return EARTH_RADIUS * c; // in meters
}
