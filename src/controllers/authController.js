const authService = require('../services/authService');

const showLogin = (req, res) => {
  res.render('login');
};

const login = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).send('Please provide email, password, and role.');
  }
  try {
    const account = await authService.login(email, password, role);
    req.session.accountId = account._id;
    req.session.role = role;
    req.session.isLoggedIn = true;
    const safeName = encodeURIComponent(account.name);
    res.redirect(`/${role}/${safeName}/dashboard`);
  } catch (error) {
    console.error('Login Error:', error.message);
    if (error.message === 'No account found with that email address.') {
      return res.status(404).send(error.message);
    }
    if (error.message === 'Invalid password.') {
      return res.status(401).send(error.message);
    }
    res.status(500).send('An error occurred during login. Please try again.');
  }
};

const signup = async (req, res) => {
  const { name, email, password, role, bio } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).send('Please fill out all required fields.');
  }
  try {
    const newAccount = await authService.signup(name, email, password, role, bio);
    req.session.accountId = newAccount._id;
    req.session.role = role;
    req.session.isLoggedIn = true;
    const safeName = encodeURIComponent(newAccount.name);
    res.redirect(`/${role}/${safeName}/dashboard`);
  } catch (error) {
    console.error('Signup Error:', error.message);
    if (error.message === 'A user with this email already exists.' || error.message === 'An artist with this email already exists.') {
      return res.status(409).send(error.message);
    }
    res.status(500).send('An error occurred during signup. Please try again.');
  }
};

const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

module.exports = {
  showLogin,
  login,
  signup,
  logout
};
