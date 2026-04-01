import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import {
  DOMEventsRecorder,
  getSingleVisibleEmailFromPage
} from './DOMEventsRecorder'

describe('DOMEventsRecorder', () => {
  it('should only add event once per input', async () => {
    // TODO
    // multiple events from single input must remove the previous ones stored in the recorder
  })

  describe('getUsername', () => {
    it('should skip unknown input before password when kind is null', async () => {
      const recorder = new DOMEventsRecorder()
      recorder.addInputEvent({
        element: document.createElement('input'),
        eventType: 'input',
        kind: null
      })

      recorder.addInputEvent({
        element: document.createElement('input'),
        eventType: 'input',
        kind: WebInputType.PASSWORD
      })
      expect(recorder.toJSON()).toMatchInlineSnapshot(`
        [
          {
            "cssSelector": "INPUT[type="text"]",
            "domOrdinal": 0,
            "inputted": undefined,
            "kind": "PASSWORD",
            "type": "input",
          },
        ]
      `)
    })

    it('should use email input as username if there is one', async () => {
      const recorder = new DOMEventsRecorder()

      const emailInput = document.createElement('input')
      emailInput.type = 'email'
      recorder.addInputEvent({
        element: emailInput,
        eventType: 'input',
        kind: WebInputType.EMAIL,
        inputted: ' jiri@groas.ai '
      })

      const textInput = document.createElement('input')
      textInput.type = 'text'
      recorder.addInputEvent({
        element: textInput,
        eventType: 'input',
        kind: WebInputType.USERNAME,
        inputted: 'display name'
      })

      expect(recorder.getUsername()).toBe('jiri@groas.ai')
    })

    it.todo(
      'should use username input as username if there are more than one email inputs'
    )

    it('should grep inner text of the HTML page body and return the email if there is exactly one on the page', async () => {
      expect(
        getSingleVisibleEmailFromPage(
          'Welcome back jiri@groas.ai',
          'accounts.google.com'
        )
      ).toBe('jiri@groas.ai')
    })
  })
})

describe('getSelectorForElement', () => {
  it.todo(
    'should return a selector based on autocomplete attribute if it is present'
  )
})
