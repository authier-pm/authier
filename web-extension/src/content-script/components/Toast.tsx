import { h } from 'preact'
import { useEffect } from 'preact/hooks'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h
import './Toast.css'

export const Toast = ({ header, text }: { header: string; text: string }) => {
  useEffect(() => {
    const x = document.getElementById('toast')
    if (x) {
      x.className = 'show'
    }
    // setTimeout(function () {
    //   x.className = x.className.replace('show', '')
    // }, 5000)
  }, [])

  return (
    <div id="toast">
      <div id="img">{header}</div>
      <div id="desc">{text}</div>
    </div>
  )
}
