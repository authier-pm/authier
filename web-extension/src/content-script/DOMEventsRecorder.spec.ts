import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { DOMEventsRecorder } from './DOMEventsRecorder'

describe('DOMEventsRecorder', () => {
  it('should only add event once per input', async () => {
    // TODO
    // multiple events from single input must remove the previous ones stored in the recorder
  })

  describe('getUsername', () => {
    it('should mark the input previous to the password kind as username', async () => {
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
            "kind": "USERNAME_OR_EMAIL",
            "type": "input",
          },
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

    it.todo('should use email input as username if there is one')

    it.todo(
      'should use username input as username if there are more than one email inputs'
    )

    it.todo(
      'should grep inner text of the HTML page body and return the email if there is exactly one on the page'
    )
  })
})

describe('getSelectorForElement', () => {
  it.todo(
    'should return a selector based on autocomplete attribute if it is present'
  )
})
