const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Artist = require('../models/artist');

const login = async (email, password, role) => {
  let account = null;
  if (role === 'user') {
    account = await User.findOne({ email });
  } else if (role === 'artist') {
    account = await Artist.findOne({ email });
  }
  
  if (!account) {
    throw new Error('No account found with that email address.');
  }
  
  const isMatch = await bcrypt.compare(password, account.password);
  if (!isMatch) {
    throw new Error('Invalid password.');
  }
  
  return account;
};

const signup = async (name, email, password, role, bio) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  let newAccount = null;
  
  if (role === 'user') {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('A user with this email already exists.');
    }
    newAccount = new User({ name, email, password: hashedPassword });
    await newAccount.save();
  } else if (role === 'artist') {
    const existingArtist = await Artist.findOne({ email });
    if (existingArtist) {
      throw new Error('An artist with this email already exists.');
    }
    newAccount = new Artist({ name, email, password: hashedPassword, bio: bio || '' });
    await newAccount.save();
  }
  
  return newAccount;
};

module.exports = {
  login,
  signup
};
