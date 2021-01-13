const mappakey = 'pk.eyJ1IjoiY2Fpcm9sZWluIiwiYSI6ImNraW5jZXl2NDBuZ3YycHAzemtudjZlZTYifQ.m10BNeMIqNZAJ7wZhYdm6A';
const mappa = new Mappa('MapboxGL', mappakey);
const version = "21";
let myMap;
let canvas;
let myFont;

let uid = gen_uid(); // unique brower/user id wird als db key benutze...
let name = "-"; // player name
let direction = -1; // wohin wird gekucked
let lat = -1; // wo bin ich
let long = -1;
let partnerKey = '-';
var database; // db ref
var players; // liste alle spieler
var netBoolean = false;
var idPartner = null;
let button;



// Designs der Map
const options = {
  
  lat: 53.0793, // center in bremen
  lng: 8.8017,
  zoom: 10,
  //style: 'mapbox://styles/mapbox/navigation-guidance-day-v4',
  //style: 'mapbox://styles/mapbox/dark-v9',
  //mapbox://styles/mapbox/navigation-guidance-day-v4
  style: 'mapbox://styles/mapbox/light-v9',

  pitch: 0,
};


function preload() {
  //myFont = loadFont('Blueberry-.otf'); // Schriftart wird geladen
  myFont = loadFont('AlohaSummer.otf'); // Schriftart wird geladen
}


function setup() {
  canvas = createCanvas(windowWidth, windowHeight); // Erstellung der Leinwand
  angleMode(DEGREES);
  textFont(myFont, 35); //Schriftart auf Leinwand laden
  textSize(35); //Schriftgrößen-STandart definiert
  watchPosition(positionChanged); // gps callback


  button = createButton('Reset Connection');
  button.position(300,30);
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

  // eingebefeld für den Namen
  name = createInput();
  name.position(120, 30);
  name.value(getItem('demoName')); // holt namen aus coookie
   
  // eingabefeld für den PartnerKey
  partnerKey = createInput();
  partnerKey.position(120, 60);
  partnerKey.value(int(random(0,1000))); // Key wird bei jedem neuladen, Öffnen der App / Seite neu initialisiert
  

  maintenancePlayerData();
  updatePlayerData();
  getAllPlayerData();
  setInterval(updateData, 2000); // daten mit server abgleichen

  myMap = mappa.tileMap(options); 
  myMap.overlay(canvas);//MapBox Karte wird auf die Leinwand gelegt.

  // myMap.onChange(drawPlayer);
}
function reset(){
  partnerKey.value(int(random(0,1000)));
}

function textDraw(){ //Schriften 
  fill(255, 105, 180);
  text("Your name", 20, 50);
  fill(84, 139, 84,200);
  text("Key", 70, 80);
  push();
  fill(255);
  noStroke();
  rect(0, (windowHeight * 0.90), windowWidth, windowHeight);
  fill(255,215,0)
  textSize(48);
  text("Catching Butterflies", 30, (windowHeight * 0.90) + 40);
  fill(121, 205, 205);
  text("!",280, (windowHeight * 0.90) + 40);
  push();
  fill(137, 104, 205,200);
  textSize(10);
  text("made by: Die Regenbogen-Dinos", 50,(windowHeight * 0.90) + 62);
  pop();
  pop();

}

function draw() { // Spieler und Schriften werden auf die Leinwand gezeichnet
  drawPlayer();
  textDraw();
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
        }
        noStroke();
        fill(121, 205, 205);
        ellipse(pos.x, pos.y, size, size);
        fill(121, 205, 205);
        text(players[k].name, pos.x + 5, pos.y);
        
        
        
        for (var j = 0; j < keys.length; j++) {
          var ko = keys[j];
          if (ko != k) { // selfcheck
            var pos_other = myMap.latLngToPixel(players[ko].lat, players[ko].long); 
            

           //if(partnerKey.value() == players[ko].partnerKey ){   
             //    stroke(137, 104, 205,200);
               //   line(mypos.x, mypos.y, pos_other.x, pos_other.y);
              //}
            }
            
          }
        }
      }
    


  pop();
}

//function mouseReleased(){
  //if (players != null) {
    //var keys = Object.keys(players);
      //for (var i = 0; i < keys.length; i++) {
        //var k = keys[i];
        //if (k != uid) {
          //for (var j = 0; j < keys.length; j++) {
            //var ko = keys[j];
            //if (ko != k) { // selfcheck
              //var pos_other = myMap.latLngToPixel(players[ko].lat, players[ko].long);
              //if(abs(pos_other.x-mouseX)<20 && abs(pos_other.y-mouseY)<20){
                //idPartner = players[ko].uid;
//
  //            }
    //        }
      //    }
       // }
      //}
    //}
  //}
//}


//}

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
    timestamp: Date.now(),
    netBoolean: netBoolean,
    idPartner: idPartner,
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
