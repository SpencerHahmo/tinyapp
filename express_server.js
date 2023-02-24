const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const express = require("express");
const { getUserByEmail, getUserPassword, getUserID } = require("./helpers");
const app = express();
const PORT = 8080;

const generateRandomString = () => {
  const characters = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomString = "";
  while (randomString.length < 6) randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  return randomString;
};

// Creates and fills an object with URLs that the current user has created
const urlsForUser = (id) => {
  let usersURLS = {};
  for (const key in urlDatabase) {
    if (id === urlDatabase[key].userID) {
      usersURLS[key] = urlDatabase[key].longURL;
    }
  }
  return usersURLS;
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  aJ48lW: {
    id: "aJ48lW",
    email: "test@me",
    password: bcrypt.hashSync("fun", 10),
  },
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
};

app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['admin', 'key1']
}));

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  if (!req.session["user_id"]) return res.redirect("/login");
  res.redirect("/urls");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (!req.session["user_id"]) return res.status(401).send("You must be signed in in order to view your shortened URLs");
  const userURLS = urlsForUser(req.session["user_id"]);
  const templateVars = { urls: userURLS, userID: req.session["user_id"], email: users[req.session["user_id"]].email };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session["user_id"]) return res.status(401).send("You can't make a new URL unless you're signed in.");
  const newShortURL = generateRandomString();
  const newLongURL = req.body.longURL;
  urlDatabase[newShortURL] = { longURL: newLongURL, userID: req.session["user_id"]};
  res.redirect(`/urls/${newShortURL}`);
});

app.get("/register", (req, res) => {
  // Should redirect to /urls if already logged in
  if (req.session["user_id"]) return res.redirect("/urls");

  const templateVars = { userID: req.session["user_id"], email: undefined };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // If the user doesn't enter an email and/ or username
  if (!email || !password) return res.status(400).send("No email/ password detected");

  if (getUserByEmail(email, users)) return res.status(400).send("There is already an account registered with that email");
  
  const userID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[userID] = { id : userID, email: email, password: hashedPassword };

  req.session["user_id"] = userID;

  res.redirect("/urls");
});

app.get("/login", (req, res) =>{
  // Should redirect to /urls if already logged in
  if (req.session["user_id"]) return res.redirect("/urls");
  
  const templateVars = { userID: req.session["user_id"], email: undefined };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // console.log("email", email, "PASSWORD", password); // Makes sure the values are what I expect

  if (getUserByEmail(email, users)) {
    if (getUserPassword(password, users)) {
      const user = getUserID(email, password, users);
      req.session["user_id"] = user;

      return res.redirect("/urls");
    }
    return res.status(403).send("The data entered does not match the database");
  }
  return res.status(403).send("There is no user in the database registered with that email");
});

app.post("/logout", (req, res) => {
  // Clears all cookies
  req.session = null;
  res.redirect("/login");
});

app.get("/urls/new", (req, res) => {
  // If the user is not logged in, redirects them to the login page
  if (!req.session["user_id"]) return res.status(401).redirect("/login");
  
  const templateVars = { userID: req.session["user_id"], email: users[req.session["user_id"]].email };
  res.render("urls_new", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) return res.status(400).send("The URL does not exist.");
  if (!req.session["user_id"]) return res.status(400).send("You must be signed in in order to delete a URL.");
  if (req.session["user_id"] !== urlDatabase[id].userID) return res.status(400).send("This account is not associated with this URL.");
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  if (!req.session["user_id"]) return res.status(400).send("You must be signed in in order to view a shortened URL page.");
  if (!urlDatabase[id]) return res.status(404).send("The short URL you entered does not exist.");
  if (req.session["user_id"] !== urlDatabase[id].userID) return res.status(400).send("This URL is not associated with your account.");
  const templateVars = { id: id, longURL: urlDatabase[id].longURL, userID: req.session["user_id"], email: users[req.session["user_id"]].email };
  return res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  if (!req.session["user_id"]) return res.status(401).send("You need to be signed in in order to edit a short URL.");
  if (req.session["user_id"] !== urlDatabase[id].userID) return res.status(403).send("This URL is not associated with your account.");
  const newLongURL = req.body.newLongURL;
  urlDatabase[id] = { longURL: newLongURL, userID: req.session["user_id"] };
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  for (const url in urlDatabase) {
    if (id === url) {
      const longURL = urlDatabase[req.params.id].longURL;
      return res.redirect(longURL);
    }
  }
  res.status(400).send("There is URL to go to.");
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});