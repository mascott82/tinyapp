const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email:  "user@example.com",
    password: "purple-monkey-dinosaur",
  },

  user2RandomID:  {
    id: "user2RandomID",
    email:  "user2example.com",
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
  let user = users[req.cookies["user_id"]];
  const templateVars = {
    // username: req.cookies["username"],
    user: user,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let user = users[req.cookies["user_id"]];
  const templateVars = {
    // username: req.cookies["username"],
    user: user,
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show.ejs", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let user = users[req.cookies["user_id"]];
  const templateVars = {
    // username: req.cookies["username"]
    user: user
  };
  res.render("registration.ejs", templateVars);
});

app.get("/login", (req, res) => {
  let user = users[req.cookies["user_id"]];
  const templateVars = {
    // username: req.cookies["username"]
    user: user
  };
  res.render("login.ejs", templateVars);
});

app.post("/urls", (req, res) => {
  let newId = generateRandomString(6);
  urlDatabase[newId] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  let id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  Object.keys(users).forEach(key => {
    if (users[key].email === req.body.username) {
      if (users[key].password === req.body.password) {
        res.cookie("user_id", users[key].id);
        return users[key];
      } else {
        return res.status(403).json({error: "Password is not match."});
      }
    }
    return null;
  });
  res.status(403).json({error: "Email is not found."});
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  let newUserId = generateRandomString(6);
  let newUserEmail = req.body.email;
  let newUserPwd = req.body.password;

  if (!newUserEmail || !newUserPwd) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  Object.keys(users).forEach(key => {
    if (users[key].email === newUserEmail) {
      return res.status(400).json({ error: 'Email is already in use.' });
    }
  });

  const newUser = {
    id: newUserId,
    email:  newUserEmail,
    password: newUserPwd
  };
  users[newUserId] = newUser;
  res.cookie("user_id", newUserId);
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