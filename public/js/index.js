import { login, logout } from './login'
import { updateSettings } from './updateSettings'
import { signup } from './signup'
/* import { bookTour } from './stripe' */

/* const bookBtn = document.getElementById('book-tour') */
const loginForm = document.querySelector('.form--login')
const logOutBtn = document.querySelector('.nav__el--logout')
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password')
const signupForm = document.querySelector('.form--signup')

/* if (bookBtn) */
/*   bookBtn.addEventListener('click', (e) => { */
/*     e.target.textContent = 'Processing...' */
/*     const { tourId } = e.target.dataset */
/*     console.log(tourId) */
/*     bookTour(tourId) */
/*   }) */
/**/

let formSubmitting = false

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault()
    
    if (formSubmitting) return // prevent multiple submissions
    formSubmitting = true
    
    const name = document.getElementById('name').value
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('passwordConfirm').value

    signup(name, email, password, passwordConfirm)
  })
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    login(email, password)
  })
}

if (logOutBtn) logOutBtn.addEventListener('click', logout)

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const form = new FormData()
    form.append('name', document.getElementById('name').value)
    form.append('email', document.getElementById('email').value)
    form.append('photo', document.getElementById('photo').files[0])

    updateSettings(form, 'data')
  })

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    document.querySelector('.btn--save-password').textContent = 'Updating...'

    const curruntPassword = document.getElementById('password-current').value
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('password-confirm').value
    await updateSettings(
      { curruntPassword, password, passwordConfirm },
      'password'
    )

    document.querySelector('.btn--save-password').textContent = 'Save password'
    document.getElementById('password-current').value = ''
    document.getElementById('password').value = ''
    document.getElementById('password-confirm').value = ''
  })
