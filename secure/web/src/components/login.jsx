import React, { useState, useEffect } from 'react';
import './login.css';

export default function Login({ onLogin, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Fetch a new CAPTCHA challenge from the backend
  const fetchCaptcha = async () => {
    try {
      setLoadingCaptcha(true);
      const res = await fetch('http://localhost:4000/captcha');
      if (res.ok) {
        const data = await res.json();
        setCaptchaId(data.captchaId);
        setCaptchaSvg(data.captchaSvg);
        setCaptchaInput('');
      }
    } catch (err) {
      console.error("Failed to load security CAPTCHA:", err);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  // Load CAPTCHA on initial render
  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Countdown timer when account is locked
  useEffect(() => {
    if (lockoutRemaining <= 0) {
      if (isLocked) setIsLocked(false);
      return;
    }

    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setError('');
          fetchCaptcha();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutRemaining, isLocked]);

  // Format seconds into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          captchaId,
          captchaAnswer: captchaInput.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Handle Account Lockout (HTTP 423)
        if (res.status === 423 || data.isLocked) {
          setIsLocked(true);
          const rem = data.remainingSeconds || 900;
          setLockoutRemaining(rem);
          setError(data.message || 'Account locked due to excessive failed attempts.');
        } else {
          setError(data.message || 'Authentication failed. Please verify your credentials.');
        }

        // Always refresh CAPTCHA on failed attempt to prevent replay attacks
        fetchCaptcha();
        return;
      }

      // Successful login
      onLogin();
    } catch (err) {
      console.error("Network or server error:", err);
      setError("Unable to contact security authentication server.");
      fetchCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel">
        <h2>Secure Login</h2>

        {/* Account Lockout Banner */}
        {isLocked && (
          <div className="lockout-banner">
            <div className="lockout-header">
              <span className="lockout-icon">🔒</span>
              <strong>Account Locked</strong>
            </div>
            <p className="lockout-desc">
              Too many consecutive failed login attempts detected.
            </p>
            <div className="countdown-pill">
              Cooldown remaining: <span>{formatTime(lockoutRemaining)}</span>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {error && !isLocked && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="glass-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLocked || submitting}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLocked || submitting}
              required
            />
          </div>

          {/* CAPTCHA Bot Protection Section */}
          <div className="captcha-section">
            <div className="captcha-header">
              <label htmlFor="captchaInput">Security Verification</label>
              <span className="captcha-badge">🛡️ Bot Protection</span>
            </div>

            <div className="captcha-row">
              <div
                className="captcha-svg-display"
                dangerouslySetInnerHTML={{ __html: captchaSvg || '<div style="padding:12px;color:#888;">Loading...</div>' }}
                title="Security verification code"
              />
              <button
                type="button"
                className="captcha-refresh-btn"
                onClick={fetchCaptcha}
                disabled={loadingCaptcha || isLocked}
                title="Generate new challenge"
              >
                🔄
              </button>
            </div>

            <input
              type="text"
              id="captchaInput"
              className="glass-input captcha-input"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
              placeholder="Enter 5 characters above"
              maxLength={5}
              disabled={isLocked || submitting}
              required
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className={`login-button ${isLocked ? 'button-locked' : ''}`}
            disabled={isLocked || submitting}
          >
            {isLocked
              ? `Account Locked (${formatTime(lockoutRemaining)})`
              : submitting
              ? 'Verifying...'
              : 'Login'}
          </button>
        </form>

        <p className="toggle-mode">
          Don't have an account?{' '}
          <span
            className="toggle-link"
            onClick={onSwitchToRegister}
          >
            Register here
          </span>
        </p>
      </div>
    </div>
  );
}
