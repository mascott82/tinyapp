// Database to store URL data and user data
const urlDatabase = {
  "b6UTxQ": {
    longURL:  "https://www.tsn.ca",
    userID: "aJ48lW",
    visits: {
      "aJ48lW": 1,
      "bF56uV": 10
    },
    createdDate:  1701357569087
  },
  "i3BoGr": {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    visits: {
      "aJ48lW": 20,
      "bF56uV": 1
    },
    createdDate:  1701357697701
  }
};

const users = {
  aJ48lW: {
    id: "aJ48lW",
    email:  "user@example.com",
    // password: "purple-monkey-dinosaur",
    password: "$2a$10$euW2ylLuqr4cQJdqb96.5.Fw.2Md791bWl0FQXJR50YBx2g5Ezkuu"
  },

  bF56uV:  {
    id: "bF56uV",
    email:  "user2@example.com",
    password: "dishwasher-funk",
  }
};

// Export the objects to make them available in other files
module.exports = { urlDatabase, users };