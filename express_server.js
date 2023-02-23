const bcrypt = require("bcryptjs");
const cookieParser = require('cookie-parser');
const express = require("express");
const app = express();
const PORT = 8080;

const generateRandomString = () => {
  const characters = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomString = "";
  while (randomString.length < 6) randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  return randomString;
};

const getUserByEmail = (email) => {
  for (const user in users) {
    if (users[user].email === email) return true;
  }
  return false;
};

const getUserPassword = (password) => {
  for (const user in users) {
    if (bcrypt.compareSync(password, users[user].password)) return true;
  }
  return false;
};

const getUserID = (email, password) => {
  for (const user in users) {
    if (users[user].email === email) {
      if (bcrypt.compareSync(password, users[user].password)) return users[user].id;
    }
  }
};

const urlsForUser = (id) => {
  /* Create a function named urlsForUser(id) which returns the URLs where
    the userID is equal to the id of the currently logged-in user.  */
  let usersURLS = {};
  for (const key in urlDatabase) {
    if (id === urlDatabase[key].userID) {
      usersURLS[key] = urlDatabase[key].longURL;
    }
  }
  return usersURLS;
};

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

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
    password: "fun",
  },
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.set("view engine", "ejs");

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  if (!req.cookies["user_id"]) return res.status(401).send("You must be signed in in order to view your shortened URLs");
  const userURLS = urlsForUser(req.cookies["user_id"]);
  const templateVars = { urls: userURLS, user_id: req.cookies["user_id"], email: users[req.cookies["user_id"]] ? users[req.cookies["user_id"]].email : null };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  // If the user is not logged in, informs them that they can't edit URLs
  if (req.cookies["user_id"] === undefined) return res.status(401).send("You can't make a new URL unless you're signed in.");
  
  // console.log(req.body); // Log the POST request body to the console
  const newShortURL = generateRandomString();
  const newLongURL = req.body.longURL;
  urlDatabase[newShortURL] = { longURL: newLongURL, userID: req.cookies["user_id"]};
  // console.log(urlDatabase); // Testing to see if the database is updated
  res.redirect(`/urls/${newShortURL}`);
});

app.get("/register", (req, res) => {
  // Should redirect to /urls if already logged in
  if (req.cookies["user_id"] !== undefined) return res.redirect("/urls");
    
  const templateVars = { user_id: req.cookies["user_id"], email: users[req.cookies["user_id"]] ? users[req.cookies["user_id"]].email : undefined };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  // If the user doesn't enter an email and/ or username
  if (!req.body.email || !req.body.password) return res.status(400).send("No email/ password detected");
  
  const email = req.body.email;
  if (getUserByEmail(email)) return res.status(400).send("There is already an account with that email");

  const user_id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[user_id] = { id : user_id, email: req.body.email, password: hashedPassword };

  res.cookie("user_id", user_id);

  // console.log(users); // Makeing sure users gets updated

  res.redirect("/urls");
});

app.get("/login", (req, res) =>{
  // Should redirect to /urls if already logged in
  if (req.cookies["user_id"] !== undefined) return res.redirect("/urls");
  
  const templateVars = { user_id: req.cookies["user_id"], email: users[req.cookies["user_id"]] ? users[req.cookies["user_id"]].email : undefined };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // console.log("email", email, "PASSWORD", password); // Makes sure the values are what I expect

  if (getUserByEmail(email)) {
    // console.log("MATCHING EMAIL WITH DATABASE");
    if (getUserPassword(password)) {
      // console.log("MATCHING PASSWORD WITH EMAIL");
      const user = getUserID(email, password);
      // console.log(user);
      res.cookie("user_id", user);

      return res.redirect("/urls");
    }
    return res.status(403).send("The data entered does not match the database");
  }
  return res.status(403).send("A user with that email can not be found");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/urls/new", (req, res) => {
  // If the user is not logged in, redirects them to the login page
  if (req.cookies["user_id"] === undefined) return res.status(401).redirect("/login");
  
  const templateVars = { user_id: req.cookies["user_id"], email: users[req.cookies["user_id"]] ? users[req.cookies["user_id"]].email : undefined };
  res.render("urls_new", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) return res.status(400).send("The URL does not exist.");
  if (!req.cookies["user_id"]) return res.status(400).send("You must be signed in in order to delete a URL.");
  if (req.cookies["user_id"] !== urlDatabase[id].userID) return res.status(400).send("This account is not associated with this URL.");
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) return res.status(400).send("You must be signed in in order to view a shortened URLs page.");
  const userURLS = urlsForUser(req.cookies["user_id"]);
  for (const key in userURLS) {
    if (key === req.params.id) {
      const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user_id: req.cookies["user_id"], email: users[req.cookies["user_id"]] ? users[req.cookies["user_id"]].email : undefined };
      return res.render("urls_show", templateVars);
    }
    if (urlDatabase[key].userID !== req.cookies["user_id"]) return res.status(401).send("This URL is not associated with your account.");
  }
  return res.status(404).send("The short URL you entered does not exist.");
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.newLongURL;
  urlDatabase[id] = { longURL: newLongURL, userID: req.cookies["user_id"] };
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});