import {useState, useEffect} from 'react'
import { useParams } from 'react-router-dom';
import './Listing.css'
import {GoogleMap, LoadScript, Circle, PlacesAutocomplete, Autocomplete, google} from '@react-google-maps/api';
import {Modal, Button, Form} from 'react-bootstrap';
import DateTimePicker from 'react-datetime-picker'
import {AiFillStar} from "react-icons/ai"
import {generateReceipt} from '../../hooks/receipt/receipt';

const Listing = () => {
    const { listing_id } = useParams();
    const apiUrl = process.env.REACT_APP_API_URL;
    const [listing, setListing] = useState({});
    const [doesExist, setDoesExist] = useState(true);
    const mapAPIKey = process.env.REACT_APP_MAP_API_KEY;
    const [latitude , setLatitude] = useState(0);
    const [longitude , setLongitude] = useState(0);
    const token = localStorage.getItem('token');
    const [showResModal, setShowResModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [infoMsg, setInfoMsg] = useState('');
    const [discount, setDiscount] = useState(0);
    const rentalFee = (listing.price * .15)
    let maxRentalLen = 0;
    const [images, setImages] = useState([]);
    const total = listing.price + rentalFee - (listing.price * discount)
    const totalBeforeFee = listing.price - (listing.price * discount)
    const [pdfData, setPdfData] = useState({})
    const [isCompleted, setIsCompleted] = useState(false);
  
    const [checkoutInfo, setCheckoutInfo] = useState({
      name: '',
      zipcode: '',
      startDate: new Date(),
      endDate: new Date(),
      promo: '',
      address: '',
      rentalLen: '',
    });

    const [paymentInfo, setPaymentInfo] = useState({
      cardNumber: '',
      expirationDate: '',
      cvv: '',
      zipCode: '',
    });
    const [isOwner, setIsOwner] = useState(false);

    const [editInfo, setEditInfo] = useState({
      name: '',
      zipcode: '',
      price: '',
      description: '',
      duration: '',
      category: '',
    });

    //Check if user is owner of listing
    useEffect(() => {
      if(token){
        const userInfo = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token,
            id: listing_id,
          }),
        };   
        fetch(`${apiUrl}/is_owner`, userInfo)
          .then(response => response.json())
          .then(data => {
            if(data.owner == true){
              setIsOwner(true);
            }
          })
          .catch(error => console.error(error));
      }
    }, []);


    const reserve = () => {
      setShowResModal(true);
    };

    const edit = () => {
      setShowEditModal(true);
      setEditInfo({
        name: listing.name,
        zipcode: listing.zipcode,
        price: listing.price,
        description: listing.description,
        duration: listing.duration,
        category: listing.category,
        })

    };

    // Actions for clicking the "checkout" button in modal 
    const checkout = () => {
      // Checks if all fields are filled out
      if(checkoutInfo.name === '' || checkoutInfo.zipcode === '' ||  checkoutInfo.address === '' || checkoutInfo.zipcode.length !== 5){
        setInfoMsg('Please fill out all fields.');
        return;
      }
      if(checkoutInfo.zipcode.length !== 5){
        setInfoMsg('Please enter a valid zipcode.');
        return;
      }


      setInfoMsg('')
      getEndDate();

      // Checks if promo code is valid
      fetch(`${apiUrl}/get_promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            promo: checkoutInfo.promo,
            }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.error){
              setInfoMsg("Promo code invalid.")
          }
          else{
            if(checkoutInfo.promo !== ''){
              setDiscount(data.discount)
            }
            setShowResModal(false);
            setShowCheckoutModal(true); 

          } 
        })
        .catch(error => console.error(error));
    }
  
    const handleInputChange = event => {
      const { name, value } = event.target;
      setCheckoutInfo({ ...checkoutInfo, [name]: value });
    };

    const handlePayInfoChange = event => {
      const { name, value } = event.target;
      setPaymentInfo({ ...paymentInfo, [name]: value });
    };

    const handleEditChange = event => {
      const { name, value } = event.target;
      setEditInfo({ ...editInfo, [name]: value });
    };

    const confirmEdit = () => {
      if(editInfo.name === '' || editInfo.zipcode === '' ||  editInfo.description === '' || editInfo.zipcode.length !== 5 || editInfo.price === '' || editInfo.duration === '' || editInfo.category === ''){
        setInfoMsg('Please fill out all fields.');
        return;
      }
      const formData = new FormData();
        formData.append('name', editInfo.name);
        formData.append('description', editInfo.description);
        formData.append('price', editInfo.price);
        formData.append('zipcode', editInfo.zipcode);
        formData.append('category', editInfo.category);
        formData.append('duration', editInfo.duration);
        formData.append('id', listing_id);
        formData.append('token', token);

        for (let i = 0; i < images.length; i++) 
            formData.append('images', images[i]);
        
        const editListing = {
            method: 'POST',
            body: formData,
        };
      fetch(`${apiUrl}/edit_product`, editListing)
        .then(response => response.json())
        .then(data => {
          if (data.error){
            setInfoMsg(data.error);
          }
          else{
            setInfoMsg('Listing edited successfully.');
            window.location.reload();
          }
        })
        .catch(error => console.error(error));
      
      setInfoMsg('')
    }

  // Displays the listing information
    useEffect(() => {
        const listingInfo = {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          };
      
          fetch(`${apiUrl}/get_listing/${listing_id}`, listingInfo)
            .then(response => response.json())
            .then(data => {
                if (data.error)
                    setDoesExist(false);
                else{
                    setListing(data);
                    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${data.zipcode}&key=${mapAPIKey}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.error) {
                                console.log(data.error);
                            } else if (data.results && data.results.length > 0) {
                                setLatitude(data.results[0].geometry.location.lat);
                                setLongitude(data.results[0].geometry.location.lng);
                            }
                        })
                        .catch(error => console.error(error));
                }
            })
            .catch(error => console.error(error));
        }, []);

        const [currentPictureIndex, setCurrentPictureIndex] = useState(0);
      
        const nextPicture = () => {
            setCurrentPictureIndex((currentPictureIndex + 1) % listing.pictures.length);
        };
          
        const previousPicture = () => {
            setCurrentPictureIndex((currentPictureIndex - 1 + listing.pictures.length) % listing.pictures.length);
        };

        // Actions when clicking the "reserve" button in modal
        const confirmReservation = () => {
          if(paymentInfo.cardNumber === '' || paymentInfo.expirationDate === '' || paymentInfo.cvv === '' || paymentInfo.zipCode === ''){
            setInfoMsg('Please fill in all the required fields.');
            return;
          }

          if(paymentInfo.cardNumber.length !== 16 && paymentInfo.cardNumber.length !== 15){
            setInfoMsg('Please enter a valid credit card number.');
            return;
          }
          

          if(paymentInfo.cvv.length !== 3){
            setInfoMsg('Please enter a valid CVV.');
            return;
          }

          if(paymentInfo.zipCode.length !== 5){
            setInfoMsg('Please enter a valid zip code.');
            return;
          }

          setInfoMsg('');

          const reservationInfo = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Time-Zone': Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            body: JSON.stringify({
              token: localStorage.getItem('token'),
              owner_email: listing.owner,
              product_id: listing_id,
              promo: checkoutInfo.promo,
              duration: listing.duration,
              start_date: checkoutInfo.startDate,
              end_date: checkoutInfo.endDate,
              payment: total,
              renter_address: checkoutInfo.address,
              payments_remaining: checkoutInfo.rentalLen - 1,
              balance_remaining: totalBeforeFee * (checkoutInfo.rentalLen - 1),
              renter_zipcode: checkoutInfo.zipcode,
            })
          };

          fetch(`${apiUrl}/complete_transaction`, reservationInfo)
            .then(response => response.json())
            .then(data => {
              if (data.error)
                setInfoMsg('There was an error completing your transaction.')
              else if(data.overlap){
                setShowCheckoutModal(false);
                setShowResModal(true);
                setInfoMsg(data.overlap)
              }
              else{
                setInfoMsg(`Your rental transaction (ID: ${data.id}) has been completed. You will receive an email confirmation shortly.`);
                setPdfData(data);
                setIsCompleted(true);
              }
            })
            .catch(error => console.error(error));
        }
        
        const formatDollar = (num) => {
          num = parseFloat(num)
          return '$' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
        }

        const stars = [];
        for (let i = 0; i < listing.rating; i++) {
          stars.push(<AiFillStar key={i} size={20} />);
        }

        const getDuration = () => {
          if(listing.duration === 'Hourly'){
            maxRentalLen = 24;
            return 'hours';
          }
          else if(listing.duration === 'Daily'){
            maxRentalLen = 25;
            return 'days';
          }
          else if(listing.duration === 'Weekly'){
            maxRentalLen = 4;
            return 'weeks';
          }
          else if(listing.duration === 'Monthly'){
            maxRentalLen = 12;
            return 'months';
          }
          else if(listing.duration === 'Yearly'){
            maxRentalLen = 5;
            return 'years';
          }
        }

        const getEndDate = () => {
          const rentalLen = parseInt(checkoutInfo.rentalLen);
          if (listing.duration === 'Hourly') {
            checkoutInfo.endDate.setDate(checkoutInfo.startDate.getDate());
            checkoutInfo.endDate.setMonth(checkoutInfo.startDate.getMonth());
            checkoutInfo.endDate.setFullYear(checkoutInfo.startDate.getFullYear());
            checkoutInfo.endDate.setHours(checkoutInfo.startDate.getHours() + rentalLen); 
          } else if (listing.duration === 'Daily') {
            checkoutInfo.endDate.setFullYear(checkoutInfo.startDate.getFullYear());
            checkoutInfo.endDate.setMonth(checkoutInfo.startDate.getMonth());
            checkoutInfo.endDate.setHours(checkoutInfo.startDate.getHours());
            checkoutInfo.endDate.setDate(checkoutInfo.startDate.getDate() + rentalLen);
          } else if (listing.duration === 'Weekly') {
            checkoutInfo.endDate.setFullYear(checkoutInfo.startDate.getFullYear());
            checkoutInfo.endDate.setMonth(checkoutInfo.startDate.getMonth());
            checkoutInfo.endDate.setHours(checkoutInfo.startDate.getHours());
            checkoutInfo.endDate.setDate(checkoutInfo.startDate.getDate() + (rentalLen * 7)); 
          } else if (listing.duration === 'Monthly') {
            checkoutInfo.endDate.setDate(checkoutInfo.startDate.getDate());
            checkoutInfo.endDate.setFullYear(checkoutInfo.startDate.getFullYear());
            checkoutInfo.endDate.setHours(checkoutInfo.startDate.getHours());
            checkoutInfo.endDate.setMonth(checkoutInfo.startDate.getMonth() + rentalLen);
          } else if (listing.duration === 'Yearly') {
            checkoutInfo.endDate.setMonth(checkoutInfo.startDate.getMonth());
            checkoutInfo.endDate.setDate(checkoutInfo.startDate.getDate());
            checkoutInfo.endDate.setHours(checkoutInfo.startDate.getHours());
            checkoutInfo.endDate.setFullYear(checkoutInfo.startDate.getFullYear() + rentalLen);
          }
        }
    
  return (  
    <div className='listing'>
      {!doesExist && <h1 className = 'h1' >This listing does not exist or has not been approved yet.</h1>}
      {doesExist && 
        <>
        <h1 className = 'h1'>{listing.category}</h1>
        <div className='listing_details'>
        <div className="container-l">
            <p>Owner:</p>
            <p> {listing.owner}</p>
          </div>
          <div className="container-l">
            <p>Listing Name:</p>
            <p> {listing.name}</p>
          </div>
          <div className="container-l">
            <p>Price:</p>
            <p>{formatDollar(listing.price)}</p>
          </div>
          <div className="container-l">
            <p>Rental Duration: </p>
            <p> {listing.duration}</p>
          </div>
          <div className="container-l">
            <p>Zip Code: </p>
            <p> {listing.zipcode}</p>
          </div>
          <div className="container-l">
            <p>Description:</p>
            <p>{listing.description}</p>
          </div>
          <div className="container-l">
            <p>Rating:</p>
            {listing.rating == null && <p> Not Rated </p>}
            {listing.rating != null && <p> {stars} </p>}
          </div>
         
            <div className="container-l">
            {token &&<button className = 'post-button' onClick = {reserve}>Reserve</button> }
            {!token && <button className = 'post-button' onClick = {() => window.location.href = '/login'}>Reserve</button>}
            {token && isOwner && <button className = 'post-button' onClick = {edit}>Edit</button> }
            </div>
          
          
          {listing.pictures && listing.pictures.length > 0 && (
            <div className='carousel'>
              <img src={`data:${listing.pictures[currentPictureIndex].mime};base64,${listing.pictures[currentPictureIndex].data}`} alt={listing.name}/>
              {listing.pictures.length > 1 && (
                <>
                  <button onClick={previousPicture}>{'<'}</button>
                  <button onClick={nextPicture}>{'>'}</button>
                </>
              )}
            </div>
          )}
        
        {/* Modal for Edit Page */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} fullscreen >
          <Modal.Header closeButton>
            <Modal.Title>Edit Listing</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{padding: '10px'}}>
            <Form>

            <Form.Group controlId="formBasicCategory" className = 'form-group'>
                <Form.Label>Category</Form.Label>
                <Form.Control as="select" name="category" defaultValue={listing.category} onChange={handleEditChange} required>
                  <option>Housing</option>
                  <option>Vehicles</option>
                  <option>Services</option>
                </Form.Control>
              </Form.Group>

              <Form.Group controlId="formBasicName" className = 'form-group'>
                <Form.Label>Listing Name</Form.Label>
                <Form.Control type="text" placeholder="Enter the listing name" name="name" defaultValue = {listing.name} onChange={handleEditChange} required/>
              </Form.Group>

              <Form.Group controlId="formBasicDescription" className = 'form-group'>
                <Form.Label>Description</Form.Label>
                <Form.Control type="text" placeholder="Enter the description" name="description" defaultValue={listing.description} onChange={handleEditChange} required/>
              </Form.Group>

              <Form.Group controlId="formBasicRentalLen" className = 'form-group'>
                <Form.Label>Rental Duration</Form.Label>
                <Form.Control as="select" name="duration" defaultValue={listing.duration} onChange={handleEditChange} required>
                  <option>Hourly</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </Form.Control>
              </Form.Group>

              <Form.Group controlId="formBasicPrice" className = 'form-group'>
                <Form.Label>Price</Form.Label>
                <Form.Control type="number" placeholder="Enter the price" name="price" defaultValue={listing.price} onChange={handleEditChange} required/>
              </Form.Group>

              <Form.Group controlId="formBasicZipcode" className = 'form-group'>  
                <Form.Label>Zip Code</Form.Label>
                <Form.Control type="text" placeholder="Enter the zip code" name="zipcode" defaultValue={listing.zipcode} onChange={handleEditChange} required/>
              </Form.Group>

              <Form.Group controlId="formBasicImages" className = 'form-group'>
                <Form.Label>Images</Form.Label>
                <Form.Control type="file" accept = '.jpg, .jpeg, .png, .gif' multiple onChange={(e) => setImages(prevImages => [...prevImages].concat([...e.target.files]))}required />
              </Form.Group>

              <Form.Group controlId="formBasicMsg" className = 'form-group'>
                <Form.Label>{infoMsg}</Form.Label>
              </Form.Group>

            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" className = 'checkout-button' onClick={confirmEdit}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

      {/* Modal for the checkout page */}
      <Modal show={showCheckoutModal} onHide={() => setShowCheckoutModal(false)} fullscreen >
        <Modal.Header closeButton>
          <Modal.Title>Checkout</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{padding: '10px'}}>
          <Form>

          <Form.Group controlId="formBasicCardNum" className = 'form-group'>
              <Form.Label>Card Number</Form.Label>
              <Form.Control type="text" placeholder="Enter the card number" name="cardNumber" value={paymentInfo.cardNumber} onChange={handlePayInfoChange} required/>
            </Form.Group>

            <Form.Group controlId="formBasicExpDate" className = 'form-group'>
              <Form.Label>Expiration Date</Form.Label>
              <Form.Control type="date" placeholder="Enter the expiration date" name="expirationDate" value={paymentInfo.expirationDate} onChange={handlePayInfoChange} required/>
            </Form.Group>


            <Form.Group controlId="formBasicCvv" className = 'form-group'>
              <Form.Label>CVV</Form.Label>
              <Form.Control type="text" placeholder="Enter the cvv" name="cvv" value={paymentInfo.cvv} onChange={handlePayInfoChange} required/>
            </Form.Group>

            <Form.Group controlId="formBasicZipCode" className = 'form-group'>
              <Form.Label>Zip Code</Form.Label>
              <Form.Control type="text" placeholder="Enter the zip code" name="zipCode" value={paymentInfo.zipCode} onChange={handlePayInfoChange} required/>
            </Form.Group>

            <Form.Group controlId="formBasicSubtotal"className = 'form-group'>
            <Form.Label > Subtotal: {formatDollar(listing.price)}</Form.Label>
            </Form.Group>

            <Form.Group controlId="formBasicFee"className = 'form-group'><hr></hr>
              <Form.Label>Rental Fee: {formatDollar(rentalFee)} </Form.Label>
            </Form.Group>

            <Form.Group controlId="formBasicPromo"className = 'form-group'><hr/>
              <Form.Label>Discount: -{formatDollar(listing.price * discount)}</Form.Label>
            </Form.Group>
            
            <Form.Group controlId="formBasicPaymentAmount"className = 'form-group'><hr/>
              {listing.duration === 'Hourly' &&
                <Form.Label>Total {listing.duration} Payments: {checkoutInfo.rentalLen} </Form.Label>
              }
              {listing.duration === 'Daily' &&
                <Form.Label>Total {listing.duration} Payments: {checkoutInfo.rentalLen} </Form.Label>
              }
              {listing.duration === 'Weekly' &&
                <Form.Label>Total {listing.duration} Payments: {checkoutInfo.rentalLen} </Form.Label>
              }
              {listing.duration === 'Monthly' &&
                <Form.Label>Total {listing.duration} Payments: {checkoutInfo.rentalLen} </Form.Label>
              }
              {listing.duration === 'Yearly' &&
                <Form.Label>Total {listing.duration} Payments: {checkoutInfo.rentalLen} </Form.Label>
              }
              <br/><Form.Label> Total: {formatDollar((totalBeforeFee * parseInt(checkoutInfo.rentalLen))+rentalFee)}</Form.Label><br/>
            </Form.Group>

            <Form.Group controlId="formBasicFirstPayment"className = 'form-group'><hr/>
              <Form.Label> First Payment Due Today: {formatDollar(total)}</Form.Label><br/>
              <Form.Label>{infoMsg}</Form.Label><br></br>
              {isCompleted && <Form.Label> <button className="link-button" onClick={() => generateReceipt(pdfData, true)}>Download Receipt</button></Form.Label>}
            </Form.Group>
            
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" className = 'confirm-button' onClick={confirmReservation}>Confirm Reservation</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for the reservation page */}
      <Modal show={showResModal} onHide={() => setShowResModal(false)} fullscreen >
        <Modal.Header closeButton>
          <Modal.Title>Reserve {listing.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{padding: '10px'}}>
          <Form>
            <Form.Group controlId="formBasicName" className = 'form-group'>
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" placeholder="Enter your name" name="name" value={checkoutInfo.name} onChange={handleInputChange} required/>
            </Form.Group>

            <Form.Group controlId="formBasicAddress"className = 'form-group'>
              <Form.Label>Address</Form.Label>
              <Form.Control type="text" placeholder="Enter your address" name="address" value={checkoutInfo.address} onChange={handleInputChange} required/> 
            </Form.Group>

            <Form.Group controlId="formBasicZip" className = 'form-group'>
              <Form.Label>Zip Code</Form.Label>
              <Form.Control type="text" placeholder="Enter your Zip Code" name="zipcode" value={checkoutInfo.zipcode} onChange={handleInputChange} required/>
            </Form.Group>

            <Form.Group controlId="formBasicPromo"className = 'form-group'>
              <Form.Label>Promo code</Form.Label>
              <Form.Control type="text" placeholder="Enter promo code" name="promo" value={checkoutInfo.promo} onChange={handleInputChange} />
            </Form.Group>

            <Form.Group controlId="formBasicStartDate"className = 'form-group'>
            <Form.Label>Start Date/Time</Form.Label><br></br>
              <DateTimePicker
                onChange={(value) => setCheckoutInfo({ ...checkoutInfo, startDate: value })}
                value={checkoutInfo.startDate}
                minDate={new Date()}
                required/>
            </Form.Group>

            <Form.Group controlId="formBasicRentalLen"className = 'form-group'>
            <Form.Label>Number of {getDuration()}</Form.Label><br></br>
            <select
              onChange={(event) => setCheckoutInfo({ ...checkoutInfo, rentalLen: event.target.value})}
              required>
                <option value = '' disabled selected></option>
              {[...Array(maxRentalLen)].map((_, index) => (
                 <option key={index + 1} value={index + 1}>
                    {index + 1}
                  </option>
                ))}
              </select>
            </Form.Group>

            <Form.Group controlId="formBasicTotal"className = 'form-group'><hr></hr>
              <Form.Label>Subtotal: {formatDollar(listing.price)} {listing.duration}</Form.Label><br></br>
              <Form.Label>{infoMsg}</Form.Label>  
            </Form.Group>
            
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" className = 'checkout-button' onClick={checkout}>Checkout</Button>
        </Modal.Footer>
      </Modal>

        </div>
          {/* Shows the map of zip code where the product is located */}
          <div className="map-container">
              <LoadScript googleMapsApiKey={mapAPIKey}>
                  <GoogleMap
                      mapContainerStyle={{ height: '400px', width: '60%', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)'}}
                      zoom={11}
                      center={{ lat: latitude, lng: longitude }}>
                      <Circle center={{ lat: latitude, lng: longitude }} radius={6000} options={{
                          strokeColor: '#FF0000',
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                          fillColor: '#FF0000',
                          fillOpacity: 0.35
                          }}
                      />
                  </GoogleMap>
              </LoadScript>
          </div>
        </>
        }
    </div>
  )
}

export default Listing