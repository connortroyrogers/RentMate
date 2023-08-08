import React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {Navbar} from "./components/"
import {Home, Cart, Profile, Login, Register, Reset, Recaptcha, Post, Listing, History, Admin, Owner, Chats } from "./pages/"

function App() {
  
  return (
    <>
      <BrowserRouter>
      <Navbar/>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/cart" element={<Cart/>}/>
          <Route path="/profile" element={<Profile/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/reset" element={<Reset/>}/>
          <Route path="/recaptcha" element={<Recaptcha/>}/>
          <Route path="/post" element={<Post/>}/>
          <Route path="/listing/:listing_id" element={<Listing/>}/>
          <Route path="/history" element={<History/>}/>
          <Route path ="/admin" element={<Admin/>}/>
          <Route path ="/owner" element={<Owner/>}/>
          <Route path ="/chats" element={<Chats/>}/>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
