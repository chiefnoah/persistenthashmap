// server.js
// where your node app starts

// init project
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// init sqlite db
var fs = require('fs');
var dbFile = './.data/sqlite.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

// init hash
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(function(){
  if (!exists) {
    db.run('CREATE TABLE `id_map` ( `digest` TEXT NOT NULL UNIQUE, `externalid` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE )');
    db.run('CREATE UNIQUE INDEX ON `id_map` (`digest`)');
    console.log('New table id_map created!');
  }
  else {
    console.log('Database "id_map" ready to go!');
    db.each('SELECT * from id_map', function(err, row) {
      if ( row ) {
        console.log('record:', row);
      }
    });
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// endpoint to get all the dreams in the database
// currently this is the only endpoint, ie. adding dreams won't update the database
// read the sqlite3 module docs and try to add your own! https://www.npmjs.com/package/sqlite3
app.get('/list', function(request, response) {
  db.all('SELECT * from `id_map`', function(err, rows) {
    response.send(JSON.stringify(rows));
  });
});

// generateMap takes an arbitrary input, hashes it, inserts it into the database, and returns the resulting externalid
function generateMap(input, callback) {
  let hash = crypto.createHash('sha256');
  hash.update(input);
  let digest = hash.digest('base64');
  console.log("Computed new map digest: " + input + " -> " + digest);
  db.serialize(() => {
    db.run("INSERT INTO `id_map` (digest) VALUES (?)", digest, (err) => {
      if (err) {
        console.log("Error inserting new digest map: " + err);
        //throw Error("Error inserting new digest map: " + err);
      }
    });

    db.get("SELECT * FROM `id_map` WHERE digest=?", digest, (err, row) => {
      if (err) {
        console.log(err);
        throw Error("Unable to get mapping: " + err);
      } else {
        return callback(row);
      }    
    });
  });
}

app.get('/externalid', (req, res) => {
  let input = req.query.q;
  try {
    generateMap(input, (pair) => {
      res.send(JSON.stringify(pair));  
    });
    
  } catch (e) {
    req.status(500);
  }
});

app.get('/uuid', (req, res) => {
  let uuid = uuidv4();
  try {
    generateMap(uuid, (pair) => {
      pair.input = uuid;
      res.send(JSON.stringify(pair));  
    });
  } catch (e) {
    req.status(500);
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
