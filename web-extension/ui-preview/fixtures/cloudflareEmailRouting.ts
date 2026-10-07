// Sanitized from the reported link-only email; account and token are synthetic.
export const cloudflareEmailRoutingSubject =
  '[Action required] Verify your Email Routing address'

export const cloudflareEmailRoutingBody = `
Verify this Email Routing address to start receiving forwarded emails

Verify email address: https://dash.cloudflare.com/email_fwdr/verify?token=example-routing-token

Account: Example@gmail[.]com's Account

Once you have verified this email address, manage your Email Routing addresses on the Email page.
Email page: https://dash.cloudflare.com/?to=/:account/:zone/email

Resources
Email Routing documentation: https://developers.cloudflare.com/email-routing/

Why am I receiving this email?
This email address was added as an Email Routing destination for the Example@gmail[.]com's Account account. If you believe you received this in error, you can safely ignore it.

Copyright © 2026 Cloudflare, Inc.
101 Townsend Street, San Francisco, CA 94107
www.cloudflare.com: https://www.cloudflare.com/
Community: https://community.cloudflare.com/
Privacy Policy: https://www.cloudflare.com/privacypolicy/
Facebook: https://www.facebook.com/Cloudflare/
X: https://x.com/Cloudflare
LinkedIn: https://www.linkedin.com/company/cloudflare
`

export const gmailCloudflareEmailRouting = `
  <div role="main">
    <h2 class="hP">${cloudflareEmailRoutingSubject}</h2>
    <div class="adn" data-message-id="#msg-f:987654321">
      <div class="gE"><span class="gD" email="noreply@notify.cloudflare.com">Cloudflare &lt;noreply@notify.cloudflare.com&gt;</span></div>
      <div class="a3s aiL">
        <p>Verify this Email Routing address to start receiving forwarded emails</p>
        <p><a href="https://dash.cloudflare.com/email_fwdr/verify?token=example-routing-token">Verify email address</a></p>
        <p>Account: Example@gmail[.]com's Account</p>
        <p>Once you have verified this email address, manage your Email Routing addresses on the <a href="https://dash.cloudflare.com/?to=/:account/:zone/email">Email page</a>.</p>
        <p>Resources<br><a href="https://developers.cloudflare.com/email-routing/">Email Routing documentation</a>.</p>
        <p>Why am I receiving this email?<br>This email address was added as an Email Routing destination for the Example@gmail[.]com's Account account. If you believe you received this in error, you can safely ignore it.</p>
        <p>Copyright © 2026 Cloudflare, Inc.<br>101 Townsend Street, San Francisco, CA 94107</p>
        <p><a href="https://www.cloudflare.com/">www.cloudflare.com</a> | <a href="https://community.cloudflare.com/">Community</a> | <a href="https://www.cloudflare.com/privacypolicy/">Privacy Policy</a></p>
      </div>
    </div>
  </div>
`
