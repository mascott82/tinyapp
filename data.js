// Database to store URL data and user data
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
  aJ48lW: {
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

// Export the objects to make them available in other files
module.exports = { urlDatabase, users };