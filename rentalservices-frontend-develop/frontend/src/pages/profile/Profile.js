import React from 'react'
import './Profile.css'
import { useState, useEffect } from 'react'
import { useUserRole } from '../../hooks/role/role';

const Profile = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const token = localStorage.getItem('token');
  const [isUpdated, setIsUpdated] = useState('');
  const role = useUserRole(token, apiUrl);
  useEffect(() => {
    const userInfo = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token
      }),
    };

    fetch(`${apiUrl}/user_info`, userInfo)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.log(data.error);
        } else {
          setEmail(data.email);
          setPhone(data.phone);
          setFirstName(data.firstName);
          setLastName(data.lastName);
        }
      })
      .catch(error => console.error(error));
  }, [token]);


  const handleDelete = (event) => {
    event.preventDefault();
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      fetch(`${apiUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.log(data.error);
        } else {
          localStorage.removeItem('token')
          window.location.href = '/'
        }
      })
      .catch(error => {
        console.error(error)
      })
    }
}



const handleEdit = (event) => {
  event.preventDefault();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    setIsUpdated('Invalid email');
    return;
  }

  const phonePattern = /^\d{10}$/;
  if (!phonePattern.test(phone.replace(/[- ]/g, ''))) {
    setIsUpdated('Invalid phone number');
    return;
  }

  fetch(`${apiUrl}/edit_user_info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: token,
      email: email.toLowerCase(),
      phone: phone.replace(/[- ]/g, ''),
      firstName: firstName,
      lastName: lastName
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) 
      setIsUpdated(data.error)
    else 
      setIsUpdated('Your new information has been saved!')
  })
  .catch(error => {
    console.error(error)
  })
}

const handleRequest = (event) => {
  event.preventDefault();
  fetch(`${apiUrl}/request_owner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: token,
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error)
      setIsUpdated('There was an error with your request. Please try again.')
    else
      setIsUpdated('Your request has been sent!')
  })
  .catch(error => {
    console.error(error)
  })
}

  return (
    <div className='background'>
    <div className='profile'>
      <h1 className = 'h1'>My Account</h1>
      <p className='profile_header'>Account Information</p>
      <div className='profile_details'>
        <div className="container-profile">
          <p>First Name:</p>
          <input id = 'firstName' className = 'container-profile-input' type="text" value={firstName} onChange={(e)=> setFirstName(e.target.value)} required />
        </div>
        <div className="container-profile">
          <p>Last Name:</p>
          <input id = 'lastName' className = 'container-profile-input' type="text" value={lastName} onChange={(e)=> setLastName(e.target.value)} required />
        </div>
        <div className="container-profile">
          <p>Email:</p>
          <input id = 'email' className = 'container-profile-input' type="text" value={email} onChange={(e)=> setEmail(e.target.value)} required />
        </div>
        <div className="container-profile">
          <p>Phone Number:</p>
          <input id='phone' className = 'container-profile-input' type="text" value={phone} onChange={(e)=> setPhone(e.target.value)} required />
        </div>
        
        <div style={{ display: 'flex' }}>
          <button className = 'save_button' onClick = {handleEdit}>Save Info</button>
          {role === 'user' && <button className = 'save_button' onClick = {handleRequest}>Request Owner Role</button>}
          <button className = 'delete_button' onClick={handleDelete}>Delete Account</button>
        </div>
        <p> {isUpdated} </p>
      </div>

    </div>
    </div>
  )
}

export default Profile