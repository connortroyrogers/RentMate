import { useState, useEffect } from 'react';

export const useUserRole = (isLoggedIn, apiUrl) => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    let token = localStorage.getItem('token');
    const userInfo = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token
      }),
    };

    fetch(`${apiUrl}/user_role`, userInfo)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.log(data.error);
        } else {
          setRole(data.role);
        }
      })
      .catch(error => console.error(error));
  }, [isLoggedIn, apiUrl]);

  return role;
};
