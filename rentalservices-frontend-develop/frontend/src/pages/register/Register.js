import React, {useEffect, useState} from 'react'
import './Register.css'
import {Link} from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.css';

const Register = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regMessage, setRegMessage] = useState('');

  const handleRegister = (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setRegMessage('Passwords do not match');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setRegMessage('Invalid email');
      return;
    }

    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(phone.replace(/[- ]/g, ''))) {
      setRegMessage('Invalid phone number');
      return;
    }

    fetch(`${apiUrl}/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email.toLowerCase(),
            phone: phone.replace(/[- ]/g, ''),
            password: password,
            securityQuestion: securityQuestion,
            securityAnswer: securityAnswer.toLowerCase(),
            firstName: firstName,
            lastName: lastName  
        })
    })
    .then(response => response.json())
    .then(data => {
      if(data.error)
        setRegMessage(data.error)
      else
        setRegMessage('Registration successful. Please login.')
    })
    .catch(error => console.error(error))
  }

  return (
    <div className='float-container'>
      <div className='row'>
        <div className='register-form col-lg-6 order-lg-1 order-1'>
          <form className = 'register_form' action="#" method="post" onSubmit={handleRegister}>
            <h1>Register</h1>
            <input className = 'register_input' type="text" id="firstname" name="firstname" placeholder = 'First name' value={firstName} onChange={(e)=> setFirstName(e.target.value)} required />
            <input className = 'register_input' type="text" id="lastname" name="lastname" placeholder = 'Last name' value = {lastName} onChange={(e)=> setLastName(e.target.value)} required />
            <input className = 'register_input' type="text" id="email" name="email" placeholder = 'Email' value={email} onChange={(e)=> setEmail(e.target.value)} required />
            <input className = 'register_input' type="text" id="phone" name="phone" placeholder = 'Phone Number' value={phone} onChange={(e)=> setPhone(e.target.value)} required />
            <input className = 'register_input' type="password" id="password" name="password" placeholder = 'Password' value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input className = 'register_input' type="password" id="confirm_password" name="confirm_password" placeholder = 'Confirm Password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <h4 className = 'register_label' htmlFor="menu">Choose a Security Question</h4>
            <select className = 'menu' id="menu" name="menu" value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} required >
              <option value = '' disabled></option>
              <option value = "What is your favorite movie?">What is your favorite movie?</option>
              <option value = "Where is your birthplace?">Where is your birthplace?</option>
              <option value = "What is your mothers maiden name?">What is your mothers maiden name?</option>
            </select>
            <input className = 'register_input' type="text" id="securityanswer" name="securityanswer" placeholder = 'Security Answer' value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required /> 
            <button className = 'register_button' type="submit">Register</button>
            {regMessage && <p>{regMessage}</p>}
          </form>
        </div>
        <div className='register-reasoning col-lg-6 order-lg-2 order-2'>
          <h1>Why you should register with us!</h1><br></br>
          <h3>Registering on our site as a customer offers a range of benefits that are sure to enhance your experience with us.<br></br><br></br>
            By creating an account, you gain access to a variety of rental options for vehicles, services, and properties that are tailored to your preferences.<br></br><br></br>
            Additionally, you can easily connect with owners and establish a relationship with them that can help you secure exclusive deals and discounts.<br></br><br></br>
            Overall, by registering on our site, you will have access to a wide range of benefits that will make your rental experience more convenient, enjoyable, and cost-effective.</h3>
        </div>
      </div>
    </div>
  )
}

export default Register