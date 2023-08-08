import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import { Nav, NavDropdown } from 'react-bootstrap';
import { useUserRole } from '../../hooks/role/role';

function Navbar() {
    const [active, setActive] = useState("nav_menu");
    const [icon, setIcon] = useState("nav_toggler");
    const isLoggedIn = localStorage.getItem("token");
    const apiUrl = process.env.REACT_APP_API_URL;
    const role = useUserRole(isLoggedIn, apiUrl);

    //Handles logout
    const handleLogout = () => {
      window.location.href = '/';
      localStorage.removeItem("token");
    };

    const navToggle = () => {
      if (active === "nav_menu") {
        setActive("nav_menu nav_active");
      } else setActive("nav_menu");
  
      // Icon Toggler
      if (icon === "nav_toggler") {
        setIcon("nav_toggler toggle");
      } else setIcon("nav_toggler");
    };
  
    return (
      <nav className="nav">  
        <NavLink to="/" className="nav_logo">RentMate</NavLink>
        <ul className={active}>
          {!isLoggedIn &&
          <>
            <li className="nav_item"><NavLink to="/" className="nav_link">Home</NavLink></li>
            <li className="nav_item"><NavLink to="/login" className="nav_link">Login</NavLink></li>
            <li className="nav_item"><NavLink to="/register" className="nav_link">Register</NavLink></li>
          </>
          }
          {isLoggedIn &&
          <>
            <li className="nav_item"><NavLink to="/" className="nav_link">Home</NavLink></li>
            <li className="nav_item"><NavLink to="#" className="nav_link" onClick={handleLogout}>Logout</NavLink></li>
            <li className='nav_item'>
              <NavDropdown title = 'Profile' id="basic-nav-dropdown">
              <NavDropdown.Item className = 'dropdown-item-custom' href="/profile">Profile Information</NavDropdown.Item>
              <NavDropdown.Item className = 'dropdown-item-custom' href="/history">Rental History</NavDropdown.Item>
              <NavDropdown.Item className = 'dropdown-item-custom' href="/chats">Chats</NavDropdown.Item>
              {(role === 'admin' || role === 'owner') && 
              <>
              <NavDropdown.Divider />
              <NavDropdown.Item className = 'dropdown-item-custom' href="/post">Post a Listing</NavDropdown.Item>
              <NavDropdown.Item className = 'dropdown-item-custom' href="/owner">Owner Portal</NavDropdown.Item>
              </>}
              {role === 'admin' && <NavDropdown.Item className = 'dropdown-item-custom' href="/admin">Admin Portal</NavDropdown.Item>}
              </NavDropdown>
            </li>
          </>
          }   
        </ul>
        <div onClick={navToggle} className={icon}>
          <div className="line1"></div>
          <div className="line2"></div>
          <div className="line3"></div>
        </div>
      </nav>
      
    );
  }
  
  export default Navbar;