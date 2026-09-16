// Sanitized Gmail-shaped DOM. No mailbox access or network requests are needed.
export const gmailVerificationEmail = `
  <div role="main">
    <h2 class="hP">Your verification code</h2>
    <div class="adn" data-message-id="#msg-f:123456789">
      <div class="gE"><span class="gD" email="someone@example.com">someone@example.com</span></div>
      <div class="a3s aiL">
        <p>Hi Alex,</p>
        <p>Your verification code is:</p>
        <p><strong><span>2</span><span>1</span><span>3</span><span>4</span><span>5</span><span>6</span></strong></p>
        <p>Enter this code to finish signing in. It expires in 10 minutes.</p>
        <p>If you didn’t request this code, you can ignore this email.</p>
      </div>
    </div>
  </div>
`

export const gmailUnreadVerificationEmail = `
  <div role="main"><table><tbody>
    <tr class="zA zE">
      <td class="yW"><span email="login@example.org">Example</span></td>
      <td class="y6"><span class="bog">Your sign-in code</span><span class="y2"> — Use A7B8C9D0 to sign in.</span></td>
    </tr>
  </tbody></table></div>
`

export const formattedEmailCodeBodies = [
  {
    name: 'nested inline elements',
    html: '<p>Your <b>verification</b> <i>code</i>:</p><strong>21<span>34<em>56</em></span></strong>',
    code: '213456'
  },
  {
    name: 'one digit per table cell with leading zeroes',
    html: '<p>Use this code to sign in:</p><table><tr><td>0</td><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr></table>',
    code: '00123456'
  },
  {
    name: 'alphanumeric characters in separate blocks',
    html: '<p>Your security code:</p><div>A</div><div>7</div><div>B</div><div>8</div><div>C</div><div>9</div><div>D</div><div>0</div>',
    code: 'A7B8C9D0'
  },
  {
    name: 'line breaks between characters',
    html: '<p>Your one-time code:</p><p>0<br>1<br>2<br>3<br>4<br>5<br>6</p>',
    code: '0123456'
  },
  {
    name: 'nonbreaking and narrow spaces',
    html: '<p>Your verification code: 21&nbsp;34&#8239;56</p>',
    code: '213456'
  },
  {
    name: 'zero-width characters and soft hyphens',
    html: '<p>Your verification code: A&#8203;7B&shy;8C&#xfeff;9</p>',
    code: 'A7B8C9'
  },
  {
    name: 'full-width Unicode characters',
    html: '<p>Your verification code: Ａ７Ｂ８Ｃ９</p>',
    code: 'A7B8C9'
  },
  {
    name: 'typographic nonbreaking hyphen',
    html: '<p>Your security code: 213&#8209;456</p>',
    code: '213456'
  },
  {
    name: 'letter-only code across inline spans',
    html: '<p>Your verification code: <span>aBc</span><strong>DeFgH</strong></p>',
    code: 'aBcDeFgH'
  },
  {
    name: 'hidden preheader and quoted old code',
    html: '<div style="display:none">Your code: 999999</div><p>Your verification code: <a href="https://example.com/verify?code=213456">213456</a></p><div class="gmail_quote">Your verification code: 111111</div>',
    code: '213456'
  }
]
