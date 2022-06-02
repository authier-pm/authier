// @ts-nocheck
import { h } from 'preact'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h
import './Toast.css'

export const Toast = () => {
  console.log('popup')

  const x = document.getElementById('toast')
  x.className = 'show'
  setTimeout(function () {
    x.className = x.className.replace('show', '')
  }, 5000)

  return (
    <div id="toast">
      <div id="img">Icon</div>
      <div id="desc">A notification message..</div>
    </div>
  )
}
