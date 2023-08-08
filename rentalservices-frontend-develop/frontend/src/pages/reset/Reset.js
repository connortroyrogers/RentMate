import React from 'react'
import './Reset.css'
import {useState} from 'react'

const Reset = () => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const [email, setEmail] = useState('');
    const [isValidUser, setIsValidUser] = useState('');
    const[isValidCode, setIsValidCode] = useState(false);
    const [isReset, setIsReset] = useState('');
    const [emailInput, setEmailInput] = useState(true);
    const [verificationInput, setVerificationInput] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [invalidCodeMsg, setInvalidCodeMsg] = useState('');
    const [showSecurityQuestion, setShowSecurityQuestion] = useState(false);
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');

    // Sends a request to the backend to verify the user's email and gets the security question associated with the account
    const verifyEmail = (event) => {
        event.preventDefault();
        fetch(`${apiUrl}/verify_email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.toLowerCase(),
            })
        })
        .then(response => response.json())
        .then(data => {
            if(data.error)
                setIsValidUser(data.error);
            else{
                setIsValidUser('');
                setEmailInput(false);
                setShowSecurityQuestion(true);
                setSecurityQuestion(data.securityQuestion);
            }
        })
        .catch(error => console.error(error))
    }

    // Sends a request to the backend to verify the user's security question
    const verifySecurityQuestion = (event) => {
        event.preventDefault();
        fetch(`${apiUrl}/security_answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.toLowerCase(),
                securityAnswer: securityAnswer.toLowerCase()
            })
        })
        .then(response => response.json())
        .then(data => {
            if(data.error)
                setIsValidUser(data.error);
            else{
                setIsValidUser('');
                setShowSecurityQuestion(false);
                setVerificationInput(true);
                sendOTP();
            }
        })
        .catch(error => console.error(error))
    }

    // Sends a request to the backend to send the user a verification code
    const sendOTP = () => {
        fetch(`${apiUrl}/send_otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.toLowerCase(),
            })
        })
        .then(response => response.json())
        .then(data => {
            if(data.error)
                setIsValidUser(data.error);
            else{
                setIsValidUser(data.message);
                setEmailInput(false);
                setVerificationInput(true);
            }
        })
        .catch(error => console.error(error))
    }

    // Verifies the verification code sent to the user's phone
    const verifyCode = (event) => {
        event.preventDefault();
        fetch(`${apiUrl}/verify_otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.toLowerCase(),
                verificationCode: verificationCode
            })
        })
        .then(response => response.json())
        .then(data => {
            if(data.error)
                setInvalidCodeMsg(data.error);
            else{
                setIsValidCode(true);
                setVerificationInput(false);
                setEmailInput(false);
                setIsValidUser('')
            }
        })
        .catch(error => setInvalidCodeMsg('There was an error verifying your code. Please try again.'));
    }

    // Sends a request to the backend to reset the password
    const resetPassword = (event) => {
        event.preventDefault();
        if(newPassword !== confirmPassword){
            alert('Passwords do not match');
            return;
        }
        fetch(`${apiUrl}/reset_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.toLowerCase(),
                newPassword: newPassword,
            })
        })
        .then(response => response.json())
        .then(data => {
            if(data.error)
                setIsReset(data.error);
            else{
                setIsReset(data.message);
            }
        })
        .catch(error => console.error(error))
    }


  return (
    <form className = 'reset_form' action="#" method="post" onSubmit = {verifyEmail}>
        <h1>Reset Password</h1>
        {emailInput && 
            <div>
                <input className = 'reset_input' type="text" placeholder = 'Email' id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required /> 
                <button className = 'reset_button' type = "submit">Continue</button>
            </div>
        }

        {showSecurityQuestion &&
            <div>
                <p className = 'reset_label'> Security Question: {securityQuestion} </p>
                <input className = 'reset_input' type="text" placeholder = 'Answer' id="answer" name="answer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} required />
                <button className = 'reset_button' onClick = {verifySecurityQuestion}>Continue</button>
            </div>
        }

        {isValidUser && <p className = 'reset_label'>{isValidUser}</p>}

        {verificationInput && 
            <div>
                <input className = 'reset_input'  type="text" placeholder = 'Enter verification code'  value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required />
                <button className = 'reset_button' onClick = {verifyCode}>Continue</button>
                <p> {invalidCodeMsg} </p>
            </div>
        }

        {isValidCode && 
            <div className = 'reset_form'>
                <input className = 'reset_input' type="password" placeholder = 'New Password' id="password" name="password" value= {newPassword} onChange={(e)=> setNewPassword(e.target.value) } required />
                <input className = 'reset_input' type="password" placeholder = 'Confirm Password' id="confirmPassword" name="confirmPassword"value= {confirmPassword} onChange={(e)=> setConfirmPassword(e.target.value) } required />
                <button className = 'reset_button' onClick = {resetPassword}>Reset</button>
                <p>{isReset}</p>
            </div>
        }

    </form>
  )
}

export default Reset