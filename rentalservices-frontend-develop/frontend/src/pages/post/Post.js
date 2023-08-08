import {React, useState} from 'react'
import './Post.css'
import { useUserRole } from '../../hooks/role/role';

const Post = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [zipcode, setZipCode] = useState('');
    const [category, setCategory] = useState('');
    const [images, setImages] = useState([]);
    const [rentalDuration, setRentalDuration] = useState('');
    const [isPosted, setIsPosted] = useState('');
    const token = localStorage.getItem('token');
    const apiUrl = process.env.REACT_APP_API_URL;
    const role = useUserRole(token, apiUrl);


    const handlePost = (event) => {
        event.preventDefault();
        if(images.length === 0 || category === '' || rentalDuration === '' || name === '' || description === '' || price === '' || zipcode === '') {
            setIsPosted('Please fill out all fields.');
            return;
        }
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('zipcode', zipcode);
        formData.append('category', category);
        formData.append('rentalDuration', rentalDuration);
        formData.append('token', token);

        for (let i = 0; i < images.length; i++) 
            formData.append('images', images[i]);
        
        const listingInfo = {
            method: 'POST',
            body: formData,
        };

        fetch(`${apiUrl}/newproduct`, listingInfo)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    setIsPosted('There was an error with submitting your listing.');
                } else {
                    setIsPosted('Your listing has been submitted for approval.');
                }
            })
            .catch(error => console.error(error));
    }

  return (
    <div className='profile'>
    {role ==='user' && <h1 className = 'h1'>You do not have access to this page.</h1>}
    {(role ==='owner' || role === 'admin') &&
        <>
        <h1 className = 'h1'>Post a New Listing</h1>
        <div className='profile_details'>
            <div className="container-post">
                <p>Category</p>
                <select className = 'menu' id="menu" name="menu" value={category} onChange={(e) => setCategory(e.target.value)} required >
                    <option value = '' disabled></option>
                    <option value = "Housing">Housing</option>
                    <option value = "Services">Services</option>
                    <option value = "Vehicles">Vehicles</option>
                </select>
            </div>
            <div className="container-post">
                <p>Rental Duration</p>
                <select className = 'menu' id="menu" name="menu" value={rentalDuration} onChange={(e) => setRentalDuration(e.target.value)} required >
                    <option value = '' disabled></option>
                    <option value = "Hourly">Hourly</option>
                    <option value = "Daily">Daily</option>
                    <option value = "Monthly">Monthly</option>
                    <option value = "Yearly">Yearly</option>
                </select>
            </div>
            <div className="container-post">
                <p>Listing Name</p>
                <input id = 'listing_name' type="text" onChange={(e)=> setName(e.target.value)} required />
            </div>
            <div className="container-post">
                <p>Description</p>
                <input id = 'description' type="text" onChange={(e)=> setDescription(e.target.value)} required />
            </div>
            <div className="container-post">
                <p>Price</p>
                <input id = 'price'type="text" placeholder = '$' onChange={(e)=> setPrice(e.target.value)} required />
            </div>
            <div className="container-post">
                <p>Zip Code</p>
                <input id='zipcode' type="text"  onChange={(e)=> setZipCode(e.target.value)} required />
            </div>
            <div className="container-post">
                <p>Upload Pictures</p>
                <input type="file" accept = '.jpg, .jpeg, .png, .gif' multiple onChange={(e) => setImages(prevImages => [...prevImages].concat([...e.target.files]))}required />

            </div>
            <div className="container-post">
                <button className = 'post-button' onClick = {handlePost}>Post</button>  
            </div>
            <p> {isPosted} </p>
        </div>
        </>
    }
</div>

  )
}

export default Post