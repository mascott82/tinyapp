const express = require('express');
// const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { getUserByEmail } = require('./helpers');

const app = express();
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['secret-key'],
  maxAge: 24 * 60 * 60 * 1000
}));
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

const urlDatabase = {
  "b6UTxQ": {
    longURL:  "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  "i3BoGr": {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  }
};

const users = {
  userRandomID: {
    id: "aJ48lW",
    email:  "user@example.com",
    // password: "purple-monkey-dinosaur",
    password: "$2a$10$euW2ylLuqr4cQJdqb96.5.Fw.2Md791bWl0FQXJR50YBx2g5Ezkuu"
  },

  user2RandomID:  {
    id: "user2RandomID",
    email:  "user2@example.com",
    password: "dishwasher-funk",
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  // res.send("<html><body>Hello <b>World</b></body></html>\n");
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.get("/urls", (req, res) => {
  let curUser = {};
  Object.keys(users).forEach(key => {
    if (users[key].id === req.session.user_id) curUser = users[key];
  });
  if (!curUser || curUser === 'undefined') {
    res.status(403).json({error: "Login or Register first!"});
  } else {
    let urls = urlsForUser(curUser.id);
    const templateVars = {
      // username: req.cookies["username"],
      user: curUser,
      urls: urls
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  // let curUser = users[req.cookies["user_id"]];
  let curUser = users[req.session.user_id];
  if (!curUser) {
    res.redirect("/login");
  }
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  // let user = users[req.cookies["user_id"]];
  let user = users[req.session.user_id];
  const templateVars = {
    // username: req.cookies["username"],
    user: user,
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  res.render("urls_show.ejs", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (!longURL) {
    return res.status(404).send("<html><body><h1>URL not found.</h1></body></html>");
  }
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  // let user = users[req.cookies["user_id"]];
  let user = users[req.session.user_id];
  const templateVars = {
    // username: req.cookies["username"]
    user: user
  };
  res.render("registration.ejs", templateVars);
});

app.get("/login", (req, res) => {
  // let user = users[req.cookies["user_id"]];
  let user = users[req.session.user_id];
  const templateVars = {
    // username: req.cookies["username"]
    user: user
  };
  res.render("login.ejs", templateVars);
});

app.post("/urls", (req, res) => {
  // let curUser = users[req.cookies["user_id"]];
  let curUser = users[req.session.user_id];
  if (!curUser) {
    return res.status(401).send("<html><body><h1>You must be logged in to shorten URLs.</h1></body></html>");
  }
  let newId = generateRandomString(6);
  urlDatabase[newId].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  let id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let curUser = getUserByEmail(req.body.email, users);
  if (!curUser) {
    return res.status(403).json({error: "Email is not found."});
  } else if (bcrypt.compareSync(req.body.password, curUser.password)) {
    req.session.user_id = curUser.id;
    res.redirect("/urls");
  } else {
    return res.status(403).json({error: "Password is not match."});
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let newUserId = generateRandomString(6);
  let newUserEmail = req.body.email;
  let newUserPwd = req.body.password;

  if (!newUserEmail || !newUserPwd) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const hashedPwd = bcrypt.hashSync(newUserPwd, 10);

  console.log(`==${hashedPwd}==`);

  Object.keys(users).forEach(key => {
    if (users[key].email === newUserEmail) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }
  });

  const newUser = {
    id: newUserId,
    email:  newUserEmail,
    // password: newUserPwd
    password: hashedPwd
  };
  users[newUserId] = newUser;
  // res.cookie("user_id", newUserId);
  req.session.user_id = newUserId;
  res.redirect("/urls");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = function(length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }

  return result;
};

const urlsForUser = function(id) {
  let urls = {};
  Object.keys(urlDatabase).forEach(key => {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key].longURL;
    }
  });
  return urls;
};