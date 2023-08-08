import { React, useState, useEffect } from 'react'
import './Admin.css'
import { useUserRole } from '../../hooks/role/role';
import { useRouteLoaderData } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';

const Admin = () => {
  const token = localStorage.getItem('token');
  const apiUrl = process.env.REACT_APP_API_URL;
  const role = useUserRole(token, apiUrl);
  const [pendingListings, setPendingListings] = useState([]);
  const [usersRequesting, setUsersRequesting] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [showPending, setShowPending] = useState(true);
  const [showUsers, setShowUsers] = useState(true);
  const [showRefunds, setShowRefunds] = useState(true);
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

    const getPendingListings = fetch(`${apiUrl}/get_pending_products`, userInfo)
      .then(response => response.json());

    const getUsersRequesting = fetch(`${apiUrl}/owner_requests`, userInfo)
      .then(response => response.json());

    const getRefundRequests = fetch(`${apiUrl}/get_refund_requests`, userInfo)
      .then(response => response.json());


    Promise.all([getPendingListings, getUsersRequesting, getRefundRequests])
      .then(([pendingListingsData, usersRequestingData, requestsData]) => {
        if (pendingListingsData.error) {
          console.log(pendingListingsData.error);
        } else {
          setPendingListings(pendingListingsData.products);
        }

        if (usersRequestingData.error) {
          console.log(usersRequestingData.error);
        } else {
          setUsersRequesting(usersRequestingData.users);
        }

        if (requestsData.error) {
          console.log(requestsData.error);
        } else {
          setRefundRequests(requestsData.requests);
        }
        setLoading(false)
      })
      .catch(error => console.log(error));
  }, []);

  const approveListing = (id) => {
    const listingInfo = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        id: id
      }),
    };

    fetch(`${apiUrl}/approve_product`, listingInfo)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.log(data.error);
        } else {
          setPendingListings(pendingListings.filter(listing => listing.id !== id));
        }
      })
      .catch(error => console.log(error));
  }

  const denyListing = (id) => {
    const listingInfo = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        id: id
      }),
    };

    fetch(`${apiUrl}/deny_product`, listingInfo)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.log(data.error);
        } else {
          setPendingListings(pendingListings.filter(listing => listing.id !== id));
        }
      })
      .catch(error => console.log(error));
  }

  const approveUser = (id) => {
    const userInfo = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        id: id
      }),
    };

    fetch(`${apiUrl}/approve_owner`, userInfo)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.log(data.error);
        } else {
          setUsersRequesting(usersRequesting.filter(user => user.id !== id));
        }
      })
      .catch(error => console.log(error));
  }

  const denyUser = (id) => {
    const userInfo = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        id: id
      }),
    };

    fetch(`${apiUrl}/deny_owner`, userInfo)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.log(data.error);
        } else {
          setUsersRequesting(usersRequesting.filter(user => user.id !== id));
        }
      })
      .catch(error => console.log(error));
  }

  const approveRefund = (id) => {
    const userInfo = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        transaction_id: id
      }),
    };

    fetch(`${apiUrl}/approve_refund`, userInfo)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.log(data.error);
        } else {
          setRefundRequests(refundRequests.filter(refund => refund.t_id !== id));
        }
      })
      .catch(error => console.log(error));
  }

  const denyRefund = (id) => {
    setRefundRequests(refundRequests.filter(refund => refund.id !== id));
  }

  return (
    <div>
      {loading ? (
        <div className='rentals-container'>
          <ClipLoader size={150} color={'#123abc'} loading={loading} />
        </div>
      ) : (
        <>
          {(role === 'user' || role === 'owner') && <h1 className='h1'>You do not have access to this page.</h1>}
          {role === 'admin' &&
            <>
              <h1 className="h1">Admin Portal</h1>
              <div>
                <div className='rentals-container'>
                  <div className='section'>
                    <h2 className='sub-title1' onClick={() => setShowPending(!showPending)}>Pending Listings</h2>
                    {showPending && pendingListings.length === 0 && <p className='sub-title1'>No pending listings</p>}
                    <div className='row-rec'>
                      {showPending && pendingListings.map((listing, index) => (
                        <div key={index} className='row-search'>
                          <a href={`listing/${listing.id}`} className="card-link">
                            <div className="card" >
                              {listing.pictures && listing.pictures.length > 0 && <img src={`data:${listing.pictures[0].mime};base64,${listing.pictures[0].data}`} alt={listing.name} className='image-card' />}
                              <div className="card-body">
                                <h5 className="card-title">{listing.name}</h5>
                                <p className="card-text">{listing.description.slice(0, 30)}{listing.description.length > 30 && "..."}</p>
                                <p className="card-text">${listing.price} {listing.duration}</p>
                                <div className="button-container">
                                  <button className="btn-primary-hist" onClick={(e) => {
                                    e.preventDefault();
                                    approveListing(listing.id)
                                  }}>Approve</button>
                                  <button className="btn-primary-hist" onClick={(e) => {
                                    e.preventDefault();
                                    denyListing(listing.id)
                                  }}>Deny</button>
                                </div>
                              </div>
                            </div>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className='section'>
                    <h2 className='sub-title1' onClick={() => setShowUsers(!showUsers)}>Users Requesting Owner Role</h2>
                    {showUsers && usersRequesting.length === 0 && <p className='sub-title1'>No users requesting owner role</p>}
                    <div className='row-rec'>
                      {showUsers && usersRequesting.map((user, index) => (
                        <div key={index} className='row-search'>
                          <div className="card" >
                            <div className="card-body">
                              <h5 className="card-title">Name: {user.first_name} {user.last_name}</h5>
                              <p className="card-text">Email: {user.email}</p>
                              <p className="card-text">Phone: {user.phone}</p>
                              <p className="card-text">Member since: {new Date(user.member_since).toLocaleDateString()}</p>
                              <div className="button-container" style={{ marginTop: "90px" }}>
                                <button className="btn-primary-hist" onClick={(e) => {
                                  e.preventDefault();
                                  approveUser(user.id);
                                }}>Approve</button>
                                <button className="btn-primary-hist" onClick={(e) => {
                                  e.preventDefault();
                                  denyUser(user.id);
                                }}>Deny</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='section'>
                    <h2 className='sub-title1' onClick={() => setShowRefunds(!showRefunds)}>Users Requesting Refund</h2>
                    {showRefunds && refundRequests.length === 0 && <p className='sub-title1'>No refund requests</p>}
                    <div className='row-rec'>
                      {showRefunds && refundRequests.map((user, index) => (
                        <div key={index} className='row-search'>
                          <div className="card" >
                            <div className="card-body">
                              <h5 className="card-title">Name: {user.first_name} {user.last_name}</h5>
                              <p className="card-text">Email: {user.email}</p>
                              <p className="card-text">Phone: {user.phone}</p>
                              <p className="card-text">Transaction ID: {user.t_id}</p>
                              <p className="card-text">Refund Amount: ${user.amount}</p>
                              <p className="card-text">Reason: {user.reason}</p>
                              <div className="button-container" style={{ marginTop: "60px" }}>
                                <button className="btn-primary-hist" onClick={(e) => {
                                  e.preventDefault();
                                  approveRefund(user.t_id);
                                }}>Approve</button>
                                <button className="btn-primary-hist" onClick={(e) => {
                                  e.preventDefault();
                                  denyRefund(user.t_id);
                                }}>Deny</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

export default Admin
