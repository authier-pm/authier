/**
 * @format
 */

import React from 'react'

import { it } from '@jest/globals'
import { ILoginFormValues, Login } from '@src/screens/Auth/Login'

import { render, screen } from '../src/utils/test-utils'

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
  //   render(<Login navigation={navigation as any} route={route as any} />)
  //
  //   const heading = screen.getByText(/Welcome/i)
  //   const text = screen.getByText(/Log in to continue!/i)
  //   expect(heading).toBeTruthy()
  //   expect(text).toBeTruthy()
  // })

  // it('submits form and sets submitted to true', async () => {
  //   const { getByText, getByPlaceholderText } = render(
  //     <Login navigation={navigation as any} route={route as any} />,
  //     { wrapper: AllTheProviders }
  //   )

  //   const emailInput = getByPlaceholderText(/Email/i)
  //   const passwordInput = getByPlaceholderText(/Password/i)
  //   const submitButton = getByText(/Submit/i)

  //   fireEvent.changeText(emailInput, 'test@example.com')
  //   fireEvent.changeText(passwordInput, 'password123')
  //   fireEvent.press(submitButton)

  //   await waitFor(() => expect(initialValues.submitted).toBe(true))
  // })

  // it('navigates to Register screen on Sign Up press', () => {
  //   const { getByText } = render(
  //     <Login navigation={navigation as any} route={route as any} />,
  //     { wrapper: AllTheProviders }
  //   )

  //   const signUpButton = getByText(/Sign Up/i)

  //   fireEvent.press(signUpButton)

  //   expect(navigation.navigate).toHaveBeenCalledWith('Register', {
  //     email: '',
  //     password: ''
  //   })
  // })
})
