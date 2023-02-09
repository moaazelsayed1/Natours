/* eslint-disable */
import axios from 'axios'
import { showAlert } from './alert'

export const signup = async (name, email, password, passwordConfirm) => {
  console.log('inside')
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    })

    if (res.data.status === 'success') {
      showAlert('success', 'signed up in successfully!')
      window.setTimeout(() => {
        location.assign('/')
      }, 1500)
    }
  } catch (err) {
    showAlert('error', err.response.data.message)
  }
}
