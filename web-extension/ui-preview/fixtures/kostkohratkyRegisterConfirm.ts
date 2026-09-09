// Reproduces the supplied form without its live registration or CSRF tokens.
export const kostkohratkyRegisterConfirmHtml = `
<div class="content-center" id="id-content-center">
  <div class="c66" data-module="system-message"></div>
  <form method="post">
    <input type="hidden" name="registerConfirm[isSubmitted]" value="1">
    <input type="hidden" name="registerConfirm[_token]" value="preview-only">
    <h1 class="c2066 c1335">Zadejte nové heslo</h1>
    <div class="c1586">
      <div class="c1587">
        <div class="c1575">Nové heslo <span class="c1576">*</span></div>
        <div class="c1577">
          <div class="c1578">
            <input type="password" name="registerConfirm[newPassword]" value="" class="c1579 c36 ">
          </div>
          <div class="c1580"></div>
        </div>
      </div>
      <div class="c1587">
        <div class="c1575">Nové heslo znovu <span class="c1576">*</span></div>
        <div class="c1577">
          <div class="c1578">
            <input type="password" name="registerConfirm[newPasswordConfirm]" value="" class="c1579 c36 ">
          </div>
          <div class="c1580"></div>
        </div>
      </div>
      <div class="c1581"><button class="btn c39 c1582">Odeslat</button></div>
    </div>
  </form>
</div>`

export const createLargeKostkohratkyFormHtml = () =>
  kostkohratkyRegisterConfirmHtml.replace(
    '<div class="c1586">',
    `<details><summary>Podmínky registrace</summary><p>${'Doplňující informace o katalogu a obchodní podmínky. '.repeat(20_000)}</p></details><div class="c1586">`
  )
