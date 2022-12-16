import { login } from './login'

const loginForm = document.querySelector('.form')

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
const email = document.getElementById('email').value
const password = document.getElementById('password').value
    login(email, password)
  })
}
