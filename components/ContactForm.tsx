'use client';

import React, { useState } from 'react';
import { useToast } from './Toast';

const TOPICS = [
  'Product Design',
  'AI Interaction',
  'Design Systems',
  'Advisory',
  'Just Saying Hi',
];

export default function ContactForm() {
  const { showToast } = useToast();

  const [selectedTopic, setSelectedTopic] = useState('Product Design');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('hello@studio.example');
      showToast('Copied hello@studio.example to clipboard!');
    } catch {
      showToast('Email address: hello@studio.example');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          ...formData,
          company: honeypot,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        showToast(`Thank you, ${formData.name}! Your transmission has been recorded.`);
        setFormData({ name: '', email: '', message: '' });
      } else {
        showToast(data.message || 'Transmission failed. Please try again.');
      }
    } catch {
      showToast('Network error while sending transmission.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPlaceholder = () => {
    if (selectedTopic === 'Just Saying Hi') {
      return 'Saying hello! Wanted to connect regarding...';
    }
    return `Tell me about your ${selectedTopic} project, scope, and target goals...`;
  };

  return (
    <section className="contact-grid">
      {/* Left Column: Details & Direct Channel */}
      <div className="contact-info">
        <h2>Direct Channel</h2>
        <p>
          I read and reply to every message personally. For quick inquiries, click below to copy the address directly to your clipboard:
        </p>

        <div
          className="email-box"
          id="copyEmailBtn"
          data-cursor="open"
          role="button"
          tabIndex={0}
          aria-label="Copy email address hello@studio.example"
          title="Click to copy email address"
          onClick={handleCopyEmail}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCopyEmail();
            }
          }}
        >
          <span id="emailAddress">hello@studio.example</span>
          <span className="copy-icon" aria-hidden="true">📋 Copy</span>
        </div>

        <div className="contact-details">
          <div className="contact-detail-row">
            <span>Location</span>
            <strong>San Francisco, CA (PST / UTC-8)</strong>
          </div>
          <div className="contact-detail-row">
            <span>Status</span>
            <strong style={{ color: 'var(--moss)' }}>
              ● Available for select Q3/Q4 engagements
            </strong>
          </div>
          <div className="contact-detail-row">
            <span>Response</span>
            <strong>Usually within 24–48 hours</strong>
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          <span
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--ink-muted)',
              marginBottom: '12px',
            }}
          >
            Elsewhere
          </span>
          <div style={{ display: 'flex', gap: '16px', fontWeight: 500 }}>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="open"
              style={{ textDecoration: 'underline' }}
            >
              LinkedIn
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="open"
              style={{ textDecoration: 'underline' }}
            >
              GitHub
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="open"
              style={{ textDecoration: 'underline' }}
            >
              X / Twitter
            </a>
            <a
              href="https://dribbble.com"
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="open"
              style={{ textDecoration: 'underline' }}
            >
              Dribbble
            </a>
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Form */}
      <form className="contact-form" id="contactForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label id="topicGroupLabel">I&apos;m inquiring about:</label>
          <div
            className="topic-pills"
            id="topicPills"
            role="radiogroup"
            aria-labelledby="topicGroupLabel"
          >
            {TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                role="radio"
                aria-checked={selectedTopic === topic}
                className={`topic-pill ${selectedTopic === topic ? 'is-selected' : ''}`}
                onClick={() => setSelectedTopic(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}
        >
          <label htmlFor="companyInput">Company</label>
          <input
            type="text"
            id="companyInput"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="nameInput">Your Name</label>
          <input
            type="text"
            id="nameInput"
            className="form-input"
            placeholder="Maya Lin"
            required
            maxLength={100}
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="emailInput">Your Email</label>
          <input
            type="email"
            id="emailInput"
            className="form-input"
            placeholder="maya@company.com"
            required
            maxLength={254}
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="messageInput">Message / Project Context</label>
          <textarea
            id="messageInput"
            className="form-textarea"
            placeholder={getPlaceholder()}
            required
            maxLength={5000}
            rows={5}
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="submit"
            className="btn btn--primary btn--magnetic"
            data-cursor="open"
            disabled={submitting}
            style={{ alignSelf: 'flex-start', marginTop: '8px' }}
          >
            {submitting ? 'Transmitting...' : 'Send Transmission →'}
          </button>
          <div aria-live="polite" aria-atomic="true">
            {submitted && (
              <span style={{ color: 'var(--moss)', fontSize: '0.9rem', fontWeight: 500 }}>
                ✓ Sent successfully
              </span>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
