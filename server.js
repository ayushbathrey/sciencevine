/*//update title of tab
Take Quiz, modify quiz, edit quiz, delete quiz
use templating for dropdown quiz selection?
*/
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var session = require('express-session');
var path = require('path');
var path = require('ejs');
// const bodyParser = require('body-parser') // grabs information from the POST data form.
const cors = require('cors')
var mysql = require('mysql');

const mongoose = require('mongoose')

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var content = fs.readFileSync("static/index.html", 'utf8');
app.use("/static", express.static('static'));
app.set('view engine', 'ejs');
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Route Files
const routeQuiz = require('./routes/quiz-routes')
// const routeResults = require('./routes/results-routes')
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'nodelogin'
});

const Schema = mongoose.Schema

// Result Schema
const ResultSchema = new Schema({
    name: String,
    score: Number,
    date: Date
})
var Result = mongoose.model("Result", ResultSchema);



// const routeResults = require('./routes/results-routes')

// Config Files
const dbConfig = require('./config/db')

// Database Connection Mongoose
mongoose.connect(dbConfig.database)
mongoose.connection.on('connected', () => {
    console.log('Connected to database ' + dbConfig.database)
})

mongoose.connection.on('error', (err) => {
    console.log('Database error ' + err)
})

app.get('/', function(request, response) {
  response.render('index.ejs');
  // sess= request.session;
});
app.get('/login', function(request, response) {
  response.render('login.ejs');
  // sess= request.session;
});

app.get('/adminlogin', function(request, response) {
  response.render('adminlogin.ejs');
  // sess= request.session;
});

app.post('/adminauth', function(request, response) {
    var username = request.body.username;
  var password = request.body.password;
  if (username && password) {
        response.redirect('/adminaccess');

  }
// response.render('/adminaccess')
});

app.get('/adminaccess', function(request, response) {

   var context = {
        user: request.session.userProfile,
        // name: request.session.userProfile.name,
        // questions: results,
        // request.session.score=quiz.score;
      };
      console.log("context:!!!",context)

      var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
      var jsonContent = JSON.parse(readQuiz);
      var titles = [];
      for (var i = 0; i<jsonContent.length; i++) {
      titles[i] = jsonContent[i]["title"];
  }
  response.render('adminaccess',{titles: titles,context});
     
  // response.render('adminaccess.ejs');
  // sess= request.session;
});

app.post('/auth', function(request, response) {
  var username = request.body.username;
  var password = request.body.password;
  if (username && password) {
    connection.query('SELECT * FROM user WHERE username = ? AND password = ?', [username, password], function(error, results) {
      if (results.length > 0) {
        request.session.loggedin = true;
        request.session.username = username;
        request.session.userProfile=results[0];
        console.log(results);
        console.log("gvssssss")
        response.redirect('/quiz');
      } else {
        response.send('Incorrect Username and/or Password!');
      }     
      // response.end();
    });
  } else {
    response.send('Please enter Username and Password!');
    // response.end();
  }
});

app.get('/signup', function(request, response) {
  // response.sendFile(path.join(__dirname + '/signup.html'));
  response.render('signup');
});

app.post('/signup', function(request, response) {
  var username = request.body.username;
  var password = request.body.password;
  var name    = request.body.name;
  var email    = request.body.email;
  var age = request.body.age;
  var address    = request.body.address;

  let stmt = `INSERT INTO user(username,password,name,email,age,address)  VALUES ?  `;
let datainsert =
[
    [username,password,name,email,age,address]
   //[{username:username},{password:password},{email:email}]
];
// console.log(username);

// execute the insert statment
connection.query(stmt, [datainsert], (err, results, fields) => {
  if (err) {
    return console.error(err.message);
  }
  // get inserted rows
  console.log('Row inserted:' + results.affectedRows);
});
response.redirect('/');
});



app.get('/quiz', function (request, response) {

  if (request.session.loggedin && request.session.userProfile.age ) {
    // response.send('Welcome back, ' + request.session.username + '!! ' + request.session.age  );
      var context = {
        user: request.session.userProfile,
        name: request.session.userProfile.name,
        // questions: results,
        // request.session.score=quiz.score;
      };
      console.log("context:!!!",context)

      var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
      var jsonContent = JSON.parse(readQuiz);
      var titles = [];
      for (var i = 0; i<jsonContent.length; i++) {
      titles[i] = jsonContent[i]["title"];
  }
  response.render('quiz',{titles: titles,context});
      // // var score=request.session.sess;
    }

    else {
    console.log('Please login to view this page!');
    response.render('login.ejs');}
  
});

app.get('/,/quiz', function (req, res) {
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  var titles = [];
  for (var i = 0; i<jsonContent.length; i++) {
    titles[i] = jsonContent[i]["title"];
  }
  res.send(JSON.stringify(titles));
});

app.post('/quiz', function(req, res){
  var sentQuiz = req.body;
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  if (jsonContent.length > 0) {
    sentQuiz["id"] = jsonContent[jsonContent.length-1]["id"] + 1;
  }
  jsonContent.push(sentQuiz);

  var jsonString = JSON.stringify(jsonContent);
  fs.writeFile("data/allQuizzes.json", jsonString);

  res.send("updated");
});

app.get('/quiz/:id', function (req, res) {
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  var targetQuiz;;
  for (var i = 0; i < jsonContent.length; i++) {
    if (jsonContent[i]["id"] === parseInt(req.params.id)) {
      targetQuiz = jsonContent[i];
      break;
    }
  }
  res.send(targetQuiz);
});

app.put('/quiz/:id', function (req, res) {
  var sentQuiz = req.body;
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  for (var i = 0; i < jsonContent.length; i++) {
    if (jsonContent[i]["id"] === parseInt(req.params.id)) {
      jsonContent[i] = sentQuiz;
      break;
    }
  }

  var jsonString = JSON.stringify(jsonContent);
  fs.writeFile("data/allQuizzes.json", jsonString);

  res.send("updated");
});

app.delete('/quiz/:id', function (req, res) {
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  for (var i = 0; i < jsonContent.length; i++) {
    if (jsonContent[i]["id"] === parseInt(req.params.id)) {
      jsonContent.splice(i, 1);
      break;
    }
  }
  var jsonString = JSON.stringify(jsonContent);
  fs.writeFile("data/allQuizzes.json", jsonString);
  res.send("deleted");
});

app.get('/reset', function (req, res) {
  var readIn = fs.readFileSync("data/defaultallquizzes.json", 'utf8');
  // var readInAdded = fs.readFileSync("data/allQuizzes.json", 'utf8');
  // fs.writeFile("data/allQuizzesRevert.json", readInAdded);
  fs.writeFile("data/allQuizzes.json", readIn);
  res.send("default quizzes restored");
});

app.get('/revert', function (req, res) {
  var readIn = fs.readFileSync("data/allQuizzesRevert.json", 'utf8');
  fs.writeFile("data/allQuizzes.json", readIn);
  res.send("reverted");
});

app.get('/users', function (req, res) {
  var readUsers = fs.readFileSync("data/users1.json", 'utf8');
  res.send(readUsers);
});

module.exports.registerResult = function (newResult, callback) {
    newResult.save(callback)
}

app.post('/users', function(req, res){
  var jsonString = JSON.stringify(req.body);
  fs.writeFile("data/users.json", jsonString);
  res.send(req.body);
  // console.log(req.body[0]);
        var name  = req.body[0].name;
		    var score =  jsonString[jsonString.length-18];
        var date  = new Date();
        var newResult = {name: name, score: score, date:date}

let stmt = `INSERT INTO result(name,score,date)  VALUES ?  `;
let datainsert =
[
    [name,score,date]
   //[{username:username},{password:password},{email:email}]
];
connection.query(stmt, [datainsert], (err, results, fields) => {
  if (err) {
    return console.error(err.message);
  }
  // get inserted rows
  console.log('Row inserted:' + results.affectedRows);
});


   Result.create(newResult, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            // res.redirect("/");
        }
    });
        var name  = req.body;

   var Id = jsonString[jsonString.length-28];
   var d = jsonString[jsonString.length-30];
  // console.log("name:",req.body[0].name,req.body[0].user_correct)
  console.log(Id);
  console.log(d);
  console.log(name);
  var readIn = fs.readFileSync("data/users1.json", 'utf8');
  fs.writeFile("data/users.json", readIn);


});

app.get('/titles', function (req, res) {
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  var titles = "[";
  for (var i = 0; i<jsonContent.length; i++) {
    if (i < jsonContent.length -1)
      titles += "\"" + jsonContent[i]["title"] + "\"" + ", ";
    else
      titles += "\"" + jsonContent[i]["title"] + "\"";
  }
  titles += "]";
  res.send(titles);
});

app.get('/titlesandids', function (req, res) {
  var readQuiz = fs.readFileSync("data/allQuizzes.json", 'utf8');
  var jsonContent = JSON.parse(readQuiz);
  var titles = [];
  for (var i = 0; i<jsonContent.length; i++) {
    titles[i] = jsonContent[i]["title"];
    titles[jsonContent.length + i] = jsonContent[i]["id"];
  }
  res.send(JSON.stringify(titles));
});


// API Routes
app.get('/about', function(request, response) {
  response.render('about.ejs');
  sess= request.session;
});app.get('/news', function(request, response) {
  response.render('news.ejs');
  sess= request.session;
});app.get('/contact', function(request, response) {
  response.render('contact.ejs');
  sess= request.session;
});app.get('/faq', function(request, response) {
  response.render('faq.ejs');
  sess= request.session;
});

app.get('/logOut', function (request, response) {
  if (request.session) {
    // delete session object
    request.session.destroy(function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("logged out successfully");
        return response.redirect('/');
      }
    });
  }
});

// app.use('/api/quiz', routeQuiz)
// app.use('/api/scores', routeResults)

var server = app.listen(process.env.PORT || 4000, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});