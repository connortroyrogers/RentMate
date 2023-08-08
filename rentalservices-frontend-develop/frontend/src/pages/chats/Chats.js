import React from 'react'
import { useState, useEffect } from 'react'
import {PrettyChatWindow} from "react-chat-engine-pretty";
import '../../components/navbar/Navbar.css';
import './Chats.css';

const Chats = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(true);

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
          setSecret(data.password_hash);
        }
        setLoading(false);
      })
      .catch(error => console.error(error));
  }, [apiUrl, token]);
  
  return (
    <div className = 'chat-window-container' style = {{height: '92vh'}}>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <PrettyChatWindow
          projectId={process.env.REACT_APP_CHAT_ENGINE_PROJECT_ID}
          username={email}
          secret={secret}
          style={{ height: "100%"}}
        />
      )}
    </div>
  );
};

export default Chats;
