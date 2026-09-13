import { useState, useEffect, useRef } from 'react'

const CHARS = '!<>-_\\/[]{}—=+*^?#________'

export default function ScrambleText({ 
  text, 
  className = '', 
  speed = 50, 
  delay = 0,
  as: Component = 'span'
}) {
  const [displayText, setDisplayText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const frameRef = useRef(0)
  const queueRef = useRef([])

  useEffect(() => {
    let timeout;
    if (delay > 0) {
      timeout = setTimeout(startAnimation, delay)
    } else {
      startAnimation()
    }
    return () => clearTimeout(timeout)
  }, [text, delay])

  const startAnimation = () => {
    setIsAnimating(true)
    const length = text.length
    const queue = []
    
    for (let i = 0; i < length; i++) {
      const from = ''
      const to = text[i] || ''
      const start = Math.floor(Math.random() * 40)
      const end = start + Math.floor(Math.random() * 40)
      queue.push({ from, to, start, end, char: '' })
    }
    
    queueRef.current = queue
    frameRef.current = 0
    update()
  }

  const update = () => {
    let output = ''
    let complete = 0
    const frame = frameRef.current
    
    for (let i = 0, n = queueRef.current.length; i < n; i++) {
      let { from, to, start, end, char } = queueRef.current[i]
      
      if (frame >= end) {
        complete++
        output += to
      } else if (frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = CHARS[Math.floor(Math.random() * CHARS.length)]
          queueRef.current[i].char = char
        }
        output += `<span class="opacity-50">${char}</span>`
      } else {
        output += from
      }
    }
    
    setDisplayText(output)
    
    if (complete === queueRef.current.length) {
      setIsAnimating(false)
    } else {
      frameRef.current++
      setTimeout(() => {
        requestAnimationFrame(update)
      }, speed)
    }
  }

  return (
    <Component 
      className={className} 
      dangerouslySetInnerHTML={{ __html: displayText }} 
    />
  )
}
