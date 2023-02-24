const bcrypt = require("bcryptjs");

const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) return user;
  }
  return undefined;
};

const getUserPassword = (password, database) => {
  for (const user in database) {
    if (bcrypt.compareSync(password, database[user].password)) return true;
  }
  return false;
};

const getUserID = (email, password, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      if (bcrypt.compareSync(password, database[user].password)) return database[user].id;
    }
  }
};

module.exports = { getUserByEmail, getUserPassword, getUserID };