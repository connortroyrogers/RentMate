import React, {useState} from 'react'
import './Login.css'
import {Link} from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isIncorrect, setIsIncorrect] = useState(''); 

  const handleLogin = (event) => {
    event.preventDefault();
    fetch(`${apiUrl}/signin`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              email: email.toLowerCase(),
              password: password,
          })
      })
      .then(response => response.json())
      .then(data => {
        if(data.error)
          setIsIncorrect(data.error);
        else if(data.password_reset_time_dif < 3600){
          localStorage.setItem('token', data.token);
          window.location.href = '/recaptcha';
        }
        else{
          localStorage.setItem('token', data.token);
          setIsIncorrect('')
          window.location.href = '/';
        }
      })
      .catch(error => console.error(error))
    }

  return (
    <form className = 'login_form' action="#" method="post" onSubmit={handleLogin}>
      <h1>Login</h1>

      <input className = 'login_input' type="text" placeholder = 'Email' id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className = 'login_input' type="password" placeholder = 'Password' id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button className = 'login_button' type="submit">Log In</button>
      {isIncorrect && <p>{isIncorrect}</p>}
      <GoogleLogin
            onSuccess={credentialResponse => {
              localStorage.setItem('token', credentialResponse.credential);
              window.location.href = '/';
            }}
            onError={() => {
              setIsIncorrect('Google login failed');

            }}
        />
      <Link to="/register" className = 'links'>Register</Link>
      <Link to="/reset" className = 'links'>Forgot Password</Link>
    </form>

  )

}
export default Login



