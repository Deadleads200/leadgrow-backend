const User = require("../models/User");

// random string generator
function randomString(length = 4) {
  return Math.random().toString(36).substring(2, 2 + length);
}

// username generator
async function generateUsername(firstName, lastName) {
  const baseUsername = `@${firstName}${lastName}`
    .toLowerCase()
    .replace(/\s+/g, "");

  // check simple username
  const exists = await User.findOne({ username: baseUsername });

  if (!exists) {
    return baseUsername;
  }

  // if exists, add random string
  let username;
  do {
    username = `${baseUsername}${randomString(4)}`;
  } while (await User.findOne({ username }));

  return username;
}

module.exports = generateUsername;
