const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

const generateRandomString = () => {
  const characters = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomString = "";
  while (randomString.length < 6) randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  return randomString;
};

app.set("view engine", "ejs");

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  // console.log(username); // Making sure the username variable gets updated on a new login
  res.cookie('username', username);
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const newShortURL = generateRandomString();
  const newLongURL = req.body.longURL;
  urlDatabase[newShortURL] = newLongURL;
  // console.log(urlDatabase); // Testing to see if the database is updated
  res.redirect(`/urls/${newShortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.newLongURL;
  urlDatabase[id] = longURL;
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});