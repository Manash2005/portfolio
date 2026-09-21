import { motion } from 'motion/react'
import { useState } from 'react'
import { fetchWithRetry } from '../utils/fetchWithRetry'
import data from '../data/portfolio_data.json'

const FIELD_STYLE = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--color-hairline)',
  outline: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  color: 'var(--color-text)',
  padding: '0.75rem 0',
  width: '100%',
  transition: 'border-color 0.2s',
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCopy = () => {
    navigator.clipboard.writeText(data.contact.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      setStatus('error')
      setErrorMsg('All fields are required.')
      return
    }
    setStatus('sending')
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://portfolio-c43c.onrender.com'
      const res = await fetchWithRetry(`${apiUrl}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', message: '' })
      } else {
        setStatus('error')
        setErrorMsg(d.message || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Could not reach the server. Try emailing directly.')
    }
  }

  return (
    <section
      id="contact"
      className="content-layer section-padding px-6 md:px-12"
      aria-label="Contact"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        {/* Left: CTA */}
        <div>
          <motion.p
            className="text-label mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Get in touch
          </motion.p>
          <div style={{ overflow: 'hidden' }}>
            <motion.h2
              className="text-heading mb-8"
              initial={{ y: '105%', opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
            >
              Let's build<br />something.
            </motion.h2>
          </div>

          {/* Email copy button */}
          <motion.button
            onClick={handleCopy}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 mb-8 group"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            aria-label="Copy email address"
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                color: copied ? 'var(--color-accent)' : 'var(--color-muted)',
                transition: 'color 0.2s',
              }}
            >
              {data.contact.email}
            </span>
            <span
              className="text-label"
              style={{ color: copied ? 'var(--color-accent)' : 'var(--color-muted)', transition: 'color 0.2s' }}
            >
              {copied ? '✓ Copied' : '↗ Copy'}
            </span>
          </motion.button>

          {/* Social links */}
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {[
              { label: 'GitHub', href: data.contact.github },
              { label: 'LinkedIn', href: data.contact.linkedin },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-label transition-colors"
                style={{ color: 'var(--color-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
              >
                {link.label} ↗
              </a>
            ))}
          </motion.div>
        </div>

        {/* Right: Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col gap-8"
          noValidate
        >
          <div>
            <label className="text-label block mb-1" htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              style={FIELD_STYLE}
              onFocus={e => e.target.style.borderBottomColor = 'var(--color-accent)'}
              onBlur={e => e.target.style.borderBottomColor = 'var(--color-hairline)'}
              aria-required="true"
            />
          </div>
          <div>
            <label className="text-label block mb-1" htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              style={FIELD_STYLE}
              onFocus={e => e.target.style.borderBottomColor = 'var(--color-accent)'}
              onBlur={e => e.target.style.borderBottomColor = 'var(--color-hairline)'}
              aria-required="true"
            />
          </div>
          <div>
            <label className="text-label block mb-1" htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              placeholder="What's on your mind?"
              style={{ ...FIELD_STYLE, resize: 'none' }}
              onFocus={e => e.target.style.borderBottomColor = 'var(--color-accent)'}
              onBlur={e => e.target.style.borderBottomColor = 'var(--color-hairline)'}
              aria-required="true"
            />
          </div>

          {/* Status messages */}
          {status === 'error' && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#FF6B6B' }}>
              {errorMsg}
            </p>
          )}
          {status === 'success' && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-accent)' }}>
              Message sent. I'll get back to you soon.
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="px-6 py-3 rounded-full text-sm font-mono transition-all self-start"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--color-accent)',
              color: '#08080C',
              fontWeight: 600,
              letterSpacing: '0.04em',
              border: 'none',
              cursor: status === 'sending' ? 'default' : 'pointer',
              opacity: status === 'sending' ? 0.6 : 1,
            }}
          >
            {status === 'sending' ? 'Sending...' : 'Send →'}
          </button>
        </motion.form>
      </div>
    </section>
  )
}