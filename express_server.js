/**
 * Express web application for URL shortening.
 * Uses bcrypt for password hashing, cookie-session for session management,
 * and method-override for handling HTTP methods.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const { getUserByEmailAndPwd } = require('./helpers');

// Import the objects from data.js
const { urlDatabase, users } = require('./data');

const app = express();

// Configure session middleware
app.use(cookieSession({
  name: 'session',
  keys: ['secret-key'],
  maxAge: 24 * 60 * 60 * 1000
}));

const PORT = 8080;

// Set EJS as the view engine
app.set("view engine", "ejs");

// Middleware for parsing URL-encoded bodies and method override
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Home route - redirects to login or URLs based on user session
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// JSON representation of the URL database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Hello route for testing
app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

// URL Index route - displays user-specific URLs
app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let curUser = users[req.session.user_id];
    let urls = urlsForUser(curUser.id);
    const templateVars = {
      user: curUser,
      urls: urls
    };
    res.render("urls_index", templateVars);
  } else {
    // User is not logged in
    const errorMessage = "You need to log in to view your URLs.";

    // Render the error template with the error message
    res.render("error", { error: errorMessage });
  }
});

// New URL route - displays form for creating a new URL
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let curUser = users[req.session.user_id];
    let templateVars = {
      user: curUser
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

/**
 * Handles the GET request for displaying details of a specific URL.
 * If the user is logged in and has the necessary permissions, it renders the details page.
 * If the user is not logged in, it renders an error message prompting them to log in.
 * If the requested URL does not exist or the user lacks permission, it renders an appropriate error message.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
app.get("/urls/:id", (req, res) => {
  let urlId = req.params.id;
  // Check if the requested URL exists
  if (!Object.hasOwn(urlDatabase, urlId)) {
    const errorMessage = "The requested URL does not exist.";
    res.render("error", { error: errorMessage });
  } else {
    if (req.session.user_id) {
      // Check if the logged-in user has permission to access the URL
      if (urlDatabase[urlId].userID !== req.session.user_id) {
        const errorMessage = "You do not have permission to access the requested URL.";
        res.render("error", { error: errorMessage });
      }
  
      // Retrieve user details
      let user = users[req.session.user_id];
      
      // Prepare template variables for rendering the details page
      const templateVars = {
        user: user,
        id: req.params.id,
        longURL: urlDatabase[req.params.id].longURL
      };
  
      // Render the URL details page
      res.render("urls_show.ejs", templateVars);
    } else {
      // User is not logged in
      const errorMessage = "You need to log in to view your URLs.";
      res.render("error", { error: errorMessage });
    }
  }
});

/**
 * Handles short URL redirection based on the provided ID parameter.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.get("/u/:id", (req, res) => {
  // Extract the URL ID from the request parameters
  let urlId = req.params.id;

  // Check if the URL ID exists in the database
  if (Object.hasOwn(urlDatabase, urlId)) {
    // Retrieve the long URL associated with the provided ID
    const longURL = urlDatabase[req.params.id].longURL;

    // Check if a valid long URL is found
    if (!longURL) {
      // Render an error page if the long URL is not found
      const errorMessage = "The requested long URL does not exist.";
      res.render("error", { error: errorMessage });
    } else {
      // Redirect to the long URL if it exists
      res.redirect(longURL);
    }
  } else {
    // Render an error page if the URL ID is not found in the database
    const errorMessage = "The requested URL does not exist.";
    res.render("error", { error: errorMessage });
  }
});

/**
 * POST endpoint for creating a new URL route
 * If the user is logged in, generates a unique short URL for the provided long URL
 * and associates it with the user's ID in the database. Redirects to the newly created URL.
 * If the user is not logged in, renders an error page with a message prompting the user to log in.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {void}
 **/
app.post("/urls", (req, res) => {
  // Check if the user is logged in
  let usrId = req.session.user_id;
  if (usrId) {
    // Generate a random 6-character string as the short URL
    let urlId = generateRandomString(6);

    // Create a new URL object with provided information
    let newUrl = {
      longURL:  req.body.longURL,
      userID: usrId,
      createdDate:  Date.now()
    };

    // Update the database with the new URL information
    urlDatabase[urlId] = newUrl;

    // Redirect to the newly created URL
    res.redirect(`/urls/${urlId}`);
  } else {
    // User is not logged in, render an error page
    const errorMessage = "You need to log in to view your URLs.";
    res.render("error", { error: errorMessage });
  }
});

/**
 * PUT endpoint for updating a URL route
 * Checks if the user is logged in. If logged in, verifies if the user has permission
 * to update the requested URL. If authorized, updates the long URL and redirects to the URLs page.
 * If not authorized, renders an error page. If the user is not logged in, renders an error page
 * prompting the user to log in.
 *
 * @param {object} req - Express request object with URL parameters and body
 * @param {object} res - Express response object
 * @returns {void}
 */
app.put("/urls/:id", (req, res) => {
  // Check if the user is logged in
  let usrId = req.session.user_id;

  if (usrId) {
    // Check if the user has permission to update the requested URL
    const curUrl = urlDatabase[req.params.id];
    if (curUrl.userID === usrId) {
      // Update the long URL in the database
      urlDatabase[req.params.id].longURL = req.body.longURL;

      // Redirect to the URLs page
      res.redirect("/urls");
    } else {
      // User is not authorized, render an error page
      const errorMessage = "You do not have permission to access the requested URL.";
      res.render("error", { error: errorMessage });
    }
  } else {
    // User is not logged in, render an error page
    const errorMessage = "You need to log in to view your URLs.";
    res.render("error", { error: errorMessage });
  }
});

/**
 * POST endpoint for deleting a URL route
 * Checks if the user is logged in. If logged in, verifies if the user has permission
 * to delete the requested URL. If authorized, deletes the URL from the database
 * and redirects to the URLs page. If not authorized, renders an error page.
 * If the user is not logged in, renders an error page prompting the user to log in.
 *
 * @param {object} req - Express request object with URL parameters
 * @param {object} res - Express response object
 * @returns {void}
 */
app.post("/urls/:id/delete", (req, res) => {
  // Check if the user is logged in
  let usrId = req.session.user_id;

  if (usrId) {
    // Check if the user has permission to delete the requested URL
    const curUrl = urlDatabase[req.params.id];
    if (curUrl.userID === usrId) {
      // Delete the URL from the database
      delete urlDatabase[req.params.id];

      // Redirect to the URLs page
      res.redirect("/urls");
    } else {
      // User is not authorized, render an error page
      const errorMessage = "You do not have permission to access the requested URL.";
      res.render("error", { error: errorMessage });
    }
  } else {
    // User is not logged in, render an error page
    const errorMessage = "You need to log in to view your URLs.";
    res.render("error", { error: errorMessage });
  }
});

/**
 * GET endpoint for user login
 * Checks if the user is already logged in. If logged in, redirects to the URLs page.
 * If not logged in, renders the login page.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {void}
 */
app.get("/login", (req, res) => {
  // Check if the user is already logged in
  let usrId = req.session.user_id;

  if (usrId) {
    // User is already logged in, redirect to the URLs page
    res.redirect("/urls");
  } else {
    // User is not logged in, render the login page
    res.render("login.ejs");
  }
});

/**
 * GET endpoint for user registration
 * Checks if the user is already logged in. If logged in, redirects to the URLs page.
 * If not logged in, renders the user registration page.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {void}
 */
app.get("/register", (req, res) => {
  // Check if the user is already logged in
  let usrId = req.session.user_id;
  if (usrId) {
    // User is already logged in, redirect to the URLs page
    res.redirect("/urls");
  } else {
    // User is not logged in, render the user registration page
    res.render("registration.ejs");
  }
});

/**
 * POST endpoint for user login with credential validation
 * Validates user credentials by checking if the provided email and password
 * match an existing user. If valid, sets the user session and redirects to the URLs page.
 * If not valid, renders an error page with a relevant error message.
 *
 * @param {object} req - Express request object with body containing user credentials
 * @param {object} res - Express response object
 * @returns {void}
 */
app.post("/login", (req, res) => {
  // Attempt to retrieve user based on provided email and password
  let curUser = getUserByEmailAndPwd(req.body.email, req.body.password, users);
  if (!curUser) {
    // User is not logged in or email and password params don't match an existing user,
    // render an error page with a relevant error message.
    const errorMessage = "Invalid email or password. Please check your credentials and try again.";
    res.render("error", { error: errorMessage });
  } else {
    // Set the user session and redirect to the URLs page
    req.session.user_id = curUser.id;
    res.redirect("/urls");
  }
});

// User logout route
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// User registration route - creates a new user
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
    password: hashedPwd
  };
  users[newUserId] = newUser;
  req.session.user_id = newUserId;
  res.redirect("/urls");

});

// Delete URL route
app.delete("/urls/:id", (req, res) => {
  const urlId = req.params.id;
  delete urlDatabase[urlId];
  res.redirect("/urls");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Helper function to generate random strings
const generateRandomString = function(length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }

  return result;
};

// Helper function to filter URLs for a specific user
const urlsForUser = function(id) {
  let urls = {};
  Object.keys(urlDatabase).forEach(key => {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key].longURL;
    }
  });
  return urls;
};