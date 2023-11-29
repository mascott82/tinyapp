/**
 * Express web application for URL shortening.
 * Uses bcrypt for password hashing, cookie-session for session management,
 * and method-override for handling HTTP methods.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const { generateRandomString, urlsForUser, getUserByEmail, getUserByEmailAndPwd } = require('./helpers');

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

/**
 * GET endpoint for the home route
 * Redirects to the login page if the user is not logged in, otherwise redirects to the URLs page.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {void}
 */
app.get("/", (req, res) => {
  // Check if the user is logged in and redirect accordingly
  if (req.session.user_id) {
    // User is logged in, redirect to the URLs page
    res.redirect("/urls");
  } else {
    // User is not logged in, redirect to the login page
    res.redirect("/login");
  }
});

/**
 * GET endpoint for the URL Index route
 * Displays user-specific URLs if the user is logged in, otherwise renders an error page.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {void}
 */
app.get("/urls", (req, res) => {
  // Check if the user is logged in
  if (req.session.user_id) {
    // Retrieve user information and their associated URLs
    let curUser = users[req.session.user_id];
    let urls = urlsForUser(curUser.id);

    // Prepare template variables for rendering
    const templateVars = {
      user: curUser,
      urls: urls
    };

    // Render the 'urls_index' template with the template variables
    res.render("urls_index", templateVars);
  } else {
    // User is not logged in, render an error page
    const errorMessage = "You need to log in to view your URLs.";

    // Render the error template with the error message
    res.render("error", { error: errorMessage });
  }
});

/**
 * GET endpoint for the New URL route
 * Displays the form for creating a new URL if the user is logged in, otherwise redirects to the login page.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {void}
 */
app.get("/urls/new", (req, res) => {
  // Check if the user is logged in
  if (req.session.user_id) {
    // Retrieve user information for rendering
    let curUser = users[req.session.user_id];

    // Prepare template variables for rendering
    let templateVars = {
      user: curUser
    };

    // Render the 'urls_new' template with the template variables
    res.render("urls_new", templateVars);
  } else {
    // User is not logged in, redirect to the login page
    res.redirect("/login");
  }
});

/**
 * GET endpoint for displaying details of a specific URL.
 * Renders the details page if the user is logged in with necessary permissions.
 * Handles cases where the user is not logged in, the requested URL doesn't exist,
 * or the user lacks permission, rendering appropriate error messages.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
app.get("/urls/:id", (req, res) => {
  let urlId = req.params.id;

  // Check if the requested URL exists
  if (!Object.hasOwn(urlDatabase, urlId)) {
    const errorMessage = "The requested URL does not exist.";
    res.render("error", { error: errorMessage });
  } else {
    // Check user login status
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
 * If the ID exists in the database, redirects to the associated long URL.
 * Renders an error page if the ID or long URL is not found.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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

/**
 * POST endpoint for user registration - creates a new user
 * Validates provided email and password, then checks if the email is already registered.
 * If valid, creates a new user with a hashed password, sets the user session, and redirects to the URLs page.
 * If invalid, renders an error page with a relevant error message.
 *
 * @param {object} req - Express request object with body containing user registration details
 * @param {object} res - Express response object
 * @returns {void}
 */
app.post("/register", (req, res) => {
  // Extract email and password from request body
  let newUserEmail = req.body.email;
  let newUserPwd = req.body.password;

  // Validate that both email and password are provided
  if (!newUserEmail || !newUserPwd) {
    // User is not logged in, or email and password parameters are empty, or they don't match an existing user,
    // render an error page with a relevant error message.
    const errorMessage = "Invalid email or password. Please make sure both email and password are provided correctly.";
    res.render("error", { error: errorMessage });
  } else if (getUserByEmail(newUserEmail, users)) {
    // The provided email already exists,
    // render an error page with a relevant error message.
    const errorMessage = "This email is already registered. Please use a different email address or log in with the existing account.";
    res.render("error", { error: errorMessage });
  } else {
    // Generate a new user ID and hash the password
    const newUserId = generateRandomString(6);
    const hashedPwd = bcrypt.hashSync(newUserPwd, 10);

    // Create a new user object
    const newUser = {
      id: newUserId,
      email:  newUserEmail,
      password: hashedPwd
    };

    // Add the new user to the users database, set user session, and redirect to the URLs page
    users[newUserId] = newUser;
    req.session.user_id = newUserId;
    res.redirect("/urls");
  }
});

/**
 * POST endpoint for user logout
 * Clears the user session and redirects to the login page.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {void}
 */
app.post("/logout", (req, res) => {
  // Clear the user session
  req.session = null;

  // Redirect to the login page
  res.redirect("/login");
});

/**
 * Start the server and listen on the specified port.
 *
 * @param {number} PORT - The port number on which the server will listen.
 * @returns {void}
 */app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});