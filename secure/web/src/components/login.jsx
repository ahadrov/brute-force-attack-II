import React, { useState } from 'react';
import './login.css';

export default function Login({ onLogin, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    fetch('http://localhost:4000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    })
    .then(async (res) => {
      if (!res.ok) {
        let errorMsg = "Login failed";
        const textData = await res.text();
        try {
          const errData = JSON.parse(textData);
          errorMsg = errData.message || errData.error || errorMsg;
        } catch (e) {
          errorMsg = textData || errorMsg;
        }
        throw new Error(errorMsg);
      }
      return res.json();
    })
    .then((data) => {
      console.log(data);
      if (data.success === false || data.error) {
        throw new Error(data.message || data.error || "Login failed");
      }
      onLogin();
    })
    .catch((error) => {
      console.error("Error:", error);
      alert(error.message || "An error occurred");
    });
  };

  return (
    <div className="login-container">
      <div className="glass-panel">
        <h2>Welcome Back</h2>
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
              required
            />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        <p className="toggle-mode">
          Don't have an account? {' '}
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