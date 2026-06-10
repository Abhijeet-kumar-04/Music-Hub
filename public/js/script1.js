const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const tabButtons = document.querySelectorAll('.tab-button');
const tabButtonsContainer = document.getElementById('tabButtonsContainer');

function showForm(formName) {
  if (formName === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabButtons[0].classList.add('active');
    tabButtons[1].classList.remove('active');
    if (tabButtonsContainer) {
      tabButtonsContainer.classList.remove('signup-active');
    }
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    tabButtons[0].classList.remove('active');
    tabButtons[1].classList.add('active');
    if (tabButtonsContainer) {
      tabButtonsContainer.classList.add('signup-active');
    }
  }
}