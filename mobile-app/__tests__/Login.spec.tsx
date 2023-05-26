/**
 * @format
 */

// Note: test renderer must be required after react-native.
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { it } from '@jest/globals'
import { ILoginFormValues, Login } from '@src/screens/Auth/Login'

describe('Login Component', () => {
  const navigation = {
    navigate: jest.fn()
  }

  const route = {
    params: {} // add any necessary default parameters here
  }

  const initialValues: ILoginFormValues = {
    email: '',
    password: '',
    submitted: false
  }

  it.todo('Login Screen')

  // it('renders correctly', () => {
  //   const { getByText } = render(
  //     <Login navigation={navigation as any} route={route as any} />
  //   )
  //
  //   expect(getByText(/Welcome/i)).toBeTruthy()
  //   expect(getByText(/Log in to continue!/i)).toBeTruthy()
  // })
  //
  // it('submits form and sets submitted to true', async () => {
  //   const { getByText, getByPlaceholderText } = render(
  //     <Login navigation={navigation as any} route={route as any} />
  //   )
  //
  //   const emailInput = getByPlaceholderText(/Email/i)
  //   const passwordInput = getByPlaceholderText(/Password/i)
  //   const submitButton = getByText(/Submit/i)
  //
  //   fireEvent.changeText(emailInput, 'test@example.com')
  //   fireEvent.changeText(passwordInput, 'password123')
  //   fireEvent.press(submitButton)
  //
  //   await waitFor(() => expect(initialValues.submitted).toBe(true))
  // })
  //
  // it('navigates to Register screen on Sign Up press', () => {
  //   const { getByText } = render(
  //     <Login navigation={navigation as any} route={route as any} />
  //   )
  //
  //   const signUpButton = getByText(/Sign Up/i)
  //
  //   fireEvent.press(signUpButton)
  //
  //   expect(navigation.navigate).toHaveBeenCalledWith('Register', {
  //     email: '',
  //     password: ''
  //   })
  // })
})
