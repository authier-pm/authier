// Sanitized Google Messages for Web DOM (Angular mws-* elements). No phone
// pairing, account or network requests are needed.
const conversation = ({
  name,
  snippet,
  unread,
  selected = false
}: {
  name: string
  snippet: string
  unread: boolean
  selected?: boolean
}) => `
  <mws-conversation-list-item>
    <a class="list-item${selected ? ' selected' : ''}" href="/web/conversations/${name.length}" role="option" aria-selected="${selected}" data-e2e-is-unread="${unread}">
      <div class="text-content${unread ? ' unread' : ''}">
        <h2 class="name-container"><span class="name" data-e2e-conversation-name>${name}</span></h2>
        <mws-conversation-snippet class="snippet-text"><span dir="auto">${snippet}</span></mws-conversation-snippet>
      </div>
      <mws-relative-timestamp>${unread ? 'Now' : '9:41'}</mws-relative-timestamp>
    </a>
  </mws-conversation-list-item>`

export const message = (text: string, outgoing = false) => `
  <mws-message-wrapper is-outgoing="${outgoing}">
    <mws-text-message-part><div class="text-msg-content"><div class="text-msg msg-content">${text}</div></div></mws-text-message-part>
  </mws-message-wrapper>`

export const googleMessagesInbox = `
  <mws-conversations-list><nav><div class="conv-container">
    ${conversation({
      name: 'AirBank',
      snippet:
        'Autorizační kód pro platbu 1 234,00 CZK u ALZA.CZ kartou *5678 je 474230.',
      unread: true
    })}
    ${conversation({
      name: 'Google',
      snippet: 'G-482913 is your Google verification code.',
      unread: false,
      selected: true
    })}
    ${conversation({
      name: 'Alex Morgan',
      snippet: 'You: See you at 10:30',
      unread: false
    })}
  </div></nav></mws-conversations-list>
  <mws-conversation-container>
    <mws-conversation-header><h2>Google</h2></mws-conversation-header>
    <mws-messages-list>
      ${message('G-111111 is your Google verification code.')}
      ${message('G-482913 is your Google verification code.')}
    </mws-messages-list>
    <div contenteditable="true" role="textbox" aria-label="Text message" data-placeholder="Text message"></div>
  </mws-conversation-container>
`

export const googleMessagesNewConversation = conversation({
  name: '+420 777 123 456',
  snippet: 'Váš ověřovací kód je 5821. Nikomu jej nesdělujte.',
  unread: true
})
