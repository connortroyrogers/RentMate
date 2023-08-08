import { useEffect, React, useState } from 'react'
import './Owner.css'
import { useUserRole } from '../../hooks/role/role';
import { Modal } from 'react-bootstrap';
import { GoogleMap, LoadScript, Circle } from '@react-google-maps/api';
import { ClipLoader } from 'react-spinners';

const Owner = () => {
  const token = localStorage.getItem('token');
  const apiUrl = process.env.REACT_APP_API_URL;
  const role = useUserRole(token, apiUrl);
  const [rentedListings, setRentedListings] = useState([]);
  const [availableListings, setAvailableListings] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [upcomingListings, setUpcomingListings] = useState([]);
  const [showRenterModal, setShowRenterModal] = useState(false);
  const [renterInfo, setRenterInfo] = useState({});
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const mapAPIKey = process.env.REACT_APP_MAP_API_KEY;
  const [showActive, setShowActive] = useState(true);
  const [showAvailable, setShowAvailable] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [loading, setLoading] = useState(true);

  const formatDollar = (num) => {
    num = parseFloat(num)
    return '$' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }

  useEffect(() => {
    fetch(`${apiUrl}/listings_for_owner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setRentedListings(data.rented);
        setUpcomingListings(data.upcoming);
        setPendingListings(data.pending);
        setAvailableListings(data.available);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching listings:", error);
      });
  }, []);



  const getRenterInfo = (listing) => {
    const userInfo = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Time-Zone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      body: JSON.stringify({
        transaction_id: listing.t_id
      }),
    };

    fetch(`${apiUrl}/renter_information`, userInfo)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.log(data.error);
        } else {
          setRenterInfo(data);
          fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${data.address}&key=${mapAPIKey}`)
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
          setShowRenterModal(true)
        }
      })
      .catch(error => console.error(error));
  }

  return (
    <div>
      {loading ? (
        <div className='rentals-container'>
          <ClipLoader size={150} color={'#123abc'} loading={loading} />
        </div>
      ) : (
        <>
          {role === 'user' && <h1 className='h1'>You do not have access to this page.</h1>}
          {(role === 'owner' || role === 'admin') &&
            <>
              <h1 className="h1">Owner Portal</h1>
              <div className='rentals-container'>
                <div className='section'>
                  <h2 className='sub-title1' onClick={() => setShowActive(!showActive)}>Currently Rented</h2>
                  {showActive && rentedListings.length === 0 && <p className='sub-title1'>No current renters</p>}
                  <div className='row-rec'>
                    {showActive && rentedListings.map((listing, index) => (
                      <div key={index} className='row-search'>
                        <a href={`listing/${listing.p_id}`} className="card-link">
                          <div className="card" >
                            {listing.pictures && listing.pictures.length > 0 && <img src={`data:${listing.pictures[0].mime};base64,${listing.pictures[0].data}`} alt={listing.name} className='image-card' />}
                            <div className="card-body">
                              <h5 className="card-title">{listing.name}</h5>
                              <p className="card-text">{listing.description.slice(0, 30)}{listing.description.length > 30 && "..."}</p>
                              <p className="card-text">{formatDollar(listing.price)} {listing.duration}</p>
                              <button className="btn btn-primary" onClick={(e) => {
                                e.preventDefault();
                                getRenterInfo(listing);

                              }}>Renter Information</button>
                            </div>
                          </div>
                        </a>
                        <Modal show={showRenterModal} onHide={() => setShowRenterModal(false)} centered>
                          <Modal.Header closeButton>
                            <Modal.Title>Renter Information</Modal.Title>
                          </Modal.Header>
                          <Modal.Body>
                            <p>Name: {renterInfo.name}</p>
                            <p>Email: {renterInfo.email}</p>
                            <p>Phone: {renterInfo.phone}</p>
                            <p>Address: {renterInfo.address}</p>
                            <p>Start: {renterInfo.start_date}</p>
                            <p>End: {renterInfo.end_date}</p>
                            <div className="map-container">
                              <LoadScript googleMapsApiKey={mapAPIKey}>
                                <GoogleMap
                                  mapContainerStyle={{ height: '150px', width: '100%', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)' }}
                                  zoom={12}
                                  center={{ lat: latitude, lng: longitude }}>
                                  <Circle center={{ lat: latitude, lng: longitude }} radius={2000} options={{
                                    strokeColor: '#FF0000',
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                    fillColor: '#FF0000',
                                    fillOpacity: 0.35
                                  }} />
                                </GoogleMap>
                              </LoadScript>
                            </div>
                          </Modal.Body>
                        </Modal>
                      </div>
                    ))}
                  </div>
                </div>
                <div className='section'>
                  <h2 className='sub-title1' onClick={() => setShowUpcoming(!showUpcoming)}>Upcoming Rentals</h2>
                  {showUpcoming && upcomingListings.length === 0 && <p className='sub-title1'>No upcoming rentals</p>}
                  <div className='row-rec'>
                    {showUpcoming && upcomingListings.map((listing, index) => (
                      <div key={index} className='row-search'>
                        <a href={`listing/${listing.p_id}`} className="card-link">
                          <div className="card" >
                            {listing.pictures && listing.pictures.length > 0 && <img src={`data:${listing.pictures[0].mime};base64,${listing.pictures[0].data}`} alt={listing.name} className='image-card' />}
                            <div className="card-body">
                              <h5 className="card-title">{listing.name}</h5>
                              <p className="card-text">{listing.description.slice(0, 30)}{listing.description.length > 30 && "..."}</p>
                              <p className="card-text">{formatDollar(listing.price)} {listing.duration}</p>
                              <button className="btn btn-primary" onClick={(e) => {
                                e.preventDefault();
                                getRenterInfo(listing);

                              }}>Renter Information</button>
                            </div>
                          </div>
                        </a>
                        <Modal show={showRenterModal} onHide={() => setShowRenterModal(false)} centered>
                          <Modal.Header closeButton>
                            <Modal.Title>Renter Information</Modal.Title>
                          </Modal.Header>
                          <Modal.Body>
                            <p>Name: {renterInfo.name}</p>
                            <p>Email: {renterInfo.email}</p>
                            <p>Phone: {renterInfo.phone}</p>
                            <p>Address: {renterInfo.address}</p>
                            <p>Start: {renterInfo.start_date}</p>
                            <p>End: {renterInfo.end_date}</p>
                            <div className="map-container">
                              <LoadScript googleMapsApiKey={mapAPIKey}>
                                <GoogleMap
                                  mapContainerStyle={{ height: '150px', width: '100%', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)' }}
                                  zoom={12}
                                  center={{ lat: latitude, lng: longitude }}>
                                  <Circle center={{ lat: latitude, lng: longitude }} radius={2000} options={{
                                    strokeColor: '#FF0000',
                                    strokeOpacity: 0.8,
                                    strokeWeight: 2,
                                    fillColor: '#FF0000',
                                    fillOpacity: 0.35
                                  }} />
                                </GoogleMap>
                              </LoadScript>
                            </div>
                          </Modal.Body>
                        </Modal>
                      </div>
                    ))}
                  </div>

                </div>
                <div className='section'>
                  <h2 className='sub-title1' onClick={() => setShowAvailable(!showAvailable)}>Available Rentals</h2>
                  {showAvailable && availableListings.length === 0 && <p className='sub-title1'>No available rentals</p>}
                  <div className='row-rec'>
                    {showAvailable && availableListings.map((listing, index) => (
                      <div key={index} className='row-search'>
                        <a href={`listing/${listing.id}`} className="card-link">
                          <div className="card" >
                            {listing.pictures && listing.pictures.length > 0 && <img src={`data:${listing.pictures[0].mime};base64,${listing.pictures[0].data}`} alt={listing.name} className='image-card' />}
                            <div className="card-body">
                              <h5 className="card-title">{listing.name}</h5>
                              <p className="card-text">{listing.description.slice(0, 30)}{listing.description.length > 30 && "..."}</p>
                              <p className="card-text">{formatDollar(listing.price)} {listing.duration}</p>
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
                <div className='section'>
                  <h2 className='sub-title1' onClick={() => setShowPending(!showPending)}>Rentals Pending Approval</h2>
                  {showPending && pendingListings.length === 0 && <p className='sub-title1'>No pending rentals</p>}
                  <div className='row-rec'>
                    {showPending && pendingListings.map((listing, index) => (
                      <div key={index} className='row-search'>
                        <a href={`listing/${listing.p_id}`} className="card-link">
                          <div className="card" >
                            {listing.pictures && listing.pictures.length > 0 && <img src={`data:${listing.pictures[0].mime};base64,${listing.pictures[0].data}`} alt={listing.name} className='image-card' />}
                            <div className="card-body">
                              <h5 className="card-title">{listing.name}</h5>
                              <p className="card-text">{listing.description.slice(0, 30)}{listing.description.length > 30 && "..."}</p>
                              <p className="card-text">${listing.price} {listing.duration}</p>
                            </div>
                          </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          }
        </>
      )}
    </div>
  )
}

export default Owner
