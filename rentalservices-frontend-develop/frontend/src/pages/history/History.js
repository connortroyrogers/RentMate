import { useEffect, React, useState } from 'react';
import './History.css';
import { Modal, Button, Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import DateTimePicker from 'react-datetime-picker'
import { ClipLoader } from 'react-spinners';
import jsPDF from 'jspdf';
import {generateReceipt} from '../../hooks/receipt/receipt';



const History = () => {
  const [currentListings, setCurrentListings] = useState([])
  const [pastListings, setPastListings] = useState([])
  const [upcomingListings, setUpcomingListings] = useState([])
  const apiUrl = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState(null);
  const [refundReason, setRefundReason] = useState(null);
  const [cancelReason, setCancelReason] = useState(null);
  const [currentListing, setCurrentListing] = useState(false);
  const [balancePayment, setBalancePayment] = useState(false);
  const [trans_id, setTrans_id] = useState('');
  const [prod_id, setProd_id] = useState('');
  const [showCurrent, setShowCurrent] = useState(true);
  const [showPast, setShowPast] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pdfData, setPdfData] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    zipCode: '',
  });

  const handlePayInfoChange = event => {
    const { name, value } = event.target;
    setPaymentInfo({ ...paymentInfo, [name]: value });
  };

  const formatDollar = (num) => {
    num = parseFloat(num)
    return '$' + num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }

  useEffect(() => {
    fetch(`${apiUrl}/listings_for_renter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Time-Zone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      body: JSON.stringify({
        token: token,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setCurrentListings(data.current);
        setPastListings(data.past);
        setUpcomingListings(data.upcoming);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching listings:", error);
      });
  }, []);

  const cancelRental = (listing) => {
    setCurrentListing(listing)
    setShowCancelModal(true);
  }



  // #avbhamid
  const cancelRentalRequest = (listing) => {

    fetch(`${apiUrl}/cancel_booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        transaction_id: listing.t_id,
      })
    })
      .then(response => response.json())
      .then(data => {
        setShowCancelModal(false)
      })

      .catch(error => console.error(error))
  }



  const reviewRental = (listing) => {
    setShowReviewModal(true);
    setProd_id(listing.p_id);
  }

  const submitReview = (listing) => {
    console.log(rating)
    if (rating == 0) {
      setInfoMsg('Please rate the product');
      return;
    }

    if (review == null) {
      setInfoMsg('Please review the product');
      return;
    }

    setInfoMsg('');

    const formData = new FormData();
    formData.append('comment', review);
    formData.append('rating', rating);
    formData.append('token', token);
    fetch(`${apiUrl}/product/${prod_id}/review`, {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        if (data.message)
          setInfoMsg(data.message);
        else
          setInfoMsg('Review submitted successfully');
      })
      .catch(error => console.error(error))
  }

  const refundRental = (listing) => {
    setInfoMsg('');
    setTrans_id(listing.t_id)
    setShowRefundModal(true);
  }

  const requestRefund = (listing) => {
    fetch(`${apiUrl}/request_refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        transaction_id: trans_id,
        reason: refundReason,
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success)
          setShowRefundModal(false);
        else if (data.error)
          setInfoMsg(data.error);
        else if (data.exists)
          setInfoMsg(data.exists);
      })
      .catch(error => console.error(error))
  }

  const showInfo = (listing) => {
    setShowInfoModal(true);
  }

  const makePayment = (listing) => {
    setInfoMsg('');
    setCurrentListing(listing)
    setShowPaymentModal(true);
  }

  const makeRentalPayment = (listing) => {
    if (paymentInfo.cardNumber === '' || paymentInfo.expirationDate === '' || paymentInfo.cvv === '' || paymentInfo.zipCode === '') {
      setInfoMsg('Please fill in all the required fields.');
      return;
    }

    if (paymentInfo.cardNumber.length !== 16 && paymentInfo.cardNumber.length !== 15) {
      setInfoMsg('Please enter a valid credit card number.');
      return;
    }


    if (paymentInfo.cvv.length !== 3) {
      setInfoMsg('Please enter a valid CVV.');
      return;
    }

    if (paymentInfo.zipCode.length !== 5) {
      setInfoMsg('Please enter a valid zip code.');
      return;
    }

    setInfoMsg('');

    const transactionInfo = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Time-Zone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      body: JSON.stringify({
        token: token,
        transaction_id: trans_id,
      })
    };

    fetch(`${apiUrl}/make_payment`, transactionInfo)
      .then(response => response.json())
      .then(data => {
        if (data.no_payment)
          setInfoMsg('No payments remaining.')
        else {
          setPdfData(data);
          setIsCompleted(true);
          setInfoMsg('Your payment has been processed. You will receive an email confirmation shortly.')
        }
      })
      .catch(error => console.error(error));
  }

return (
    <>
      {loading ? (
        <div className='rentals-container'>
          <ClipLoader size={150} color={'#123abc'} loading={loading} />
        </div>
      ) : (
        <>
          <h1 className="h1">Rental History</h1>
          <div className='rentals-container'>
            <div className='section'>
              <h2 className='sub-title1' onClick={() => setShowCurrent(!showCurrent)}>Current Rentals</h2>
              {showCurrent && currentListings.length === 0 && <p className='sub-title1'>No current rentals</p>}
              <div className='row-rec'>
                {showCurrent && currentListings.map((listing, index) => (
                  <div key={index} className='row-search'>
                    <a href={`listing/${listing.p_id}`} className="card-link">
                      <div className="card" >
                        {listing.pictures && listing.pictures.length > 0 && <img src={`data:${listing.pictures[0].mime};base64,${listing.pictures[0].data}`} alt={listing.name} className='image-card' />}
                        <div className="card-body">
                          <h5 className="card-title">{listing.name}</h5>
                          <p className="card-text">Start: {listing.start}</p>
                          <p className="card-text">End: {listing.end}</p>
                          <div className="button-container">
                            {!listing.is_cancelled && <button className="btn-primary-hist" onClick={(e) => {
                              e.preventDefault();
                              setTrans_id(listing.t_id)
                              makePayment(listing);
                            }}>Make Payment</button>}

                            {
                              listing?.is_cancelled ? <button className="btn-danger" onClick={(e) => {
                                e.preventDefault();
                              }} >CANCELLED</button> :

                                <button className="btn-primary-hist" onClick={(e) => {
                                  e.preventDefault();
                                  cancelRental(listing);
                                }}>Cancel</button>

                            }
                          </div>
                        </div>
                      </div>
                    </a>
                    <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
                      <Modal.Header closeButton>
                        <Modal.Title>Make Payment</Modal.Title>
                      </Modal.Header>
                      <Modal.Body style={{ padding: '10px' }}>
                        <Form>
                          {!currentListing.due && <Form.Label> No payments remaining!</Form.Label>}
                          {currentListing.due &&
                            <>
                              <Form.Group controlId="formBasicFirstPayment" className='form-group'>
                                <Form.Label>Payment Amount: {formatDollar(currentListing.price)}</Form.Label>
                              </Form.Group>

                              <Form.Group controlId="formBasicFirstPaymentDue" className='form-group'>
                                <Form.Label> Due Date: {currentListing.due_date}</Form.Label>
                              </Form.Group>

                              <Form.Group controlId="formBasicFirstPaymentRemaining" className='form-group'>
                                <Form.Label> Total Payments Remaining: {currentListing.remaining}</Form.Label>
                              </Form.Group>

                              <Form.Group controlId="formBasicCardNum" className='form-group'>
                                <Form.Label>Card Number</Form.Label>
                                <Form.Control type="text" placeholder="Enter the card number" name="cardNumber" value={paymentInfo.cardNumber} onChange={handlePayInfoChange} required />
                              </Form.Group>

                              <Form.Group controlId="formBasicExpDate" className='form-group'>
                                <Form.Label>Expiration Date</Form.Label>
                                <Form.Control type="date" placeholder="Enter the expiration date" name="expirationDate" value={paymentInfo.expirationDate} onChange={handlePayInfoChange} required />
                              </Form.Group>


                              <Form.Group controlId="formBasicCvv" className='form-group'>
                                <Form.Label>CVV</Form.Label>
                                <Form.Control type="text" placeholder="Enter the cvv" name="cvv" value={paymentInfo.cvv} onChange={handlePayInfoChange} required />
                              </Form.Group>

                              <Form.Group controlId="formBasicZipCode" className='form-group'>
                                <Form.Label>Zip Code</Form.Label>
                                <Form.Control type="text" placeholder="Enter the zip code" name="zipCode" value={paymentInfo.zipCode} onChange={handlePayInfoChange} required />
                                <Form.Label>{infoMsg}</Form.Label>
                                {isCompleted && <Form.Label> <button className="link-button" onClick={() => generateReceipt(pdfData, false)}>Download Receipt</button></Form.Label>}
                              </Form.Group>
                            </>
                          }
                        </Form>
                        {currentListing.due && <button className="submit-button" onClick={(e) => {
                          e.preventDefault();
                          makeRentalPayment(currentListing);
                        }}>Pay</button>}
                      </Modal.Body>
                    </Modal>

                    <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                      <Modal.Header closeButton>
                        <Modal.Title>Cancel</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <div className="model-body">
                          Reason to cancel:
                          <textarea style={{ width: '80%' }} rows='3' onChange={(e) => setCancelReason(e.target.value)}></textarea>
                          <button className="submit-button" onClick={(e) => {
                            e.preventDefault();
                            cancelRentalRequest(currentListing);
                          }}>Cancel Rental</button>
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
                          <p className="card-text">Start: {listing.start}</p>
                          <p className="card-text">End: {listing.end}</p>
                          <div className="button-container">
                            {!listing.is_cancelled && <button className="btn-primary-hist" onClick={(e) => {
                              e.preventDefault();
                              setTrans_id(listing.t_id)
                              makePayment(listing);
                            }}>Make Payment</button>}

                            {listing?.is_cancelled ? <button className="btn-danger" onClick={(e) => {
                              e.preventDefault();
                            }} >CANCELLED</button> :

                              <button className="btn-primary-hist" onClick={(e) => {
                                e.preventDefault();
                                cancelRental(listing);
                              }}>Cancel</button>

                            }
                          </div>
                        </div>
                      </div>
                    </a>
                    <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
                      <Modal.Header closeButton>
                        <Modal.Title>Make Payment</Modal.Title>
                      </Modal.Header>
                      <Modal.Body style={{ padding: '10px' }}>
                        <Form>
                          {!currentListing.due && <Form.Label> No payments remaining!</Form.Label>}
                          {currentListing.due &&
                            <>
                              <Form.Group controlId="formBasicFirstPayment" className='form-group'>
                                <Form.Label> Payment Amount: {formatDollar(currentListing.price)}</Form.Label>
                              </Form.Group>

                              <Form.Group controlId="formBasicFirstPaymentDue" className='form-group'>
                                <Form.Label> Due Date: {currentListing.due_date}</Form.Label>
                              </Form.Group>

                              <Form.Group controlId="formBasicFirstPaymentRemaining" className='form-group'>
                                <Form.Label> Total Payments Remaining: {currentListing.remaining}</Form.Label>
                              </Form.Group>

                              <Form.Group controlId="formBasicCardNum" className='form-group'>
                                <Form.Label>Card Number</Form.Label>
                                <Form.Control type="text" placeholder="Enter the card number" name="cardNumber" value={paymentInfo.cardNumber} onChange={handlePayInfoChange} required />
                              </Form.Group>

                              <Form.Group controlId="formBasicExpDate" className='form-group'>
                                <Form.Label>Expiration Date</Form.Label>
                                <Form.Control type="date" placeholder="Enter the expiration date" name="expirationDate" value={paymentInfo.expirationDate} onChange={handlePayInfoChange} required />
                              </Form.Group>


                              <Form.Group controlId="formBasicCvv" className='form-group'>
                                <Form.Label>CVV</Form.Label>
                                <Form.Control type="text" placeholder="Enter the cvv" name="cvv" value={paymentInfo.cvv} onChange={handlePayInfoChange} required />
                              </Form.Group>

                              <Form.Group controlId="formBasicZipCode" className='form-group'>
                                <Form.Label>Zip Code</Form.Label>
                                <Form.Control type="text" placeholder="Enter the zip code" name="zipCode" value={paymentInfo.zipCode} onChange={handlePayInfoChange} required />
                                <Form.Label>{infoMsg}</Form.Label>
                                {isCompleted && <Form.Label> <button className="link-button" onClick={() => generateReceipt(pdfData)}>Download Receipt</button></Form.Label>}
                              </Form.Group>
                            </>}
                        </Form>
                        {currentListing.due && <button className="submit-button" onClick={(e) => {
                          e.preventDefault();
                          makeRentalPayment(currentListing);
                        }}>Pay</button>}
                      </Modal.Body>
                    </Modal>
                    <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                      <Modal.Header closeButton>
                        <Modal.Title>Cancel Rental</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <div className="model-body">
                          Reason to cancel:
                          <textarea style={{ width: '80%' }} rows='3' onChange={(e) => setCancelReason(e.target.value)}></textarea>
                          <button className="submit-button" onClick={(e) => {
                            e.preventDefault();
                            cancelRentalRequest(currentListing);
                          }}>Cancel Rental</button>
                        </div>
                      </Modal.Body>
                    </Modal>
                  </div>
                ))}
              </div>
            </div>
            <div className='section'>
              <h2 className='sub-title1' onClick={() => setShowPast(!showPast)}>Past Rentals</h2>
              {showPast && pastListings.length === 0 && <p className='sub-title1'>No past rentals</p>}
              <div className='row-rec'>
                {showPast && pastListings.map((listing, index) => (
                  <div key={index} className='row-search'>
                    <a href={`listing/${listing.p_id}`} className="card-link">
                      <div className="card" >
                        {listing.pictures && listing.pictures.length > 0 && <img src={`data:${listing.pictures[0].mime};base64,${listing.pictures[0].data}`} alt={listing.name} className='image-card' />}
                        <div className="card-body">
                          <h5 className="card-title">{listing.name}</h5>
                          <p className="card-text">{listing.description.slice(0, 30)}{listing.description.length > 30 && "..."}</p>
                          <p className="card-text">${listing.price} {listing.duration}</p>
                          <div className="button-container">
                            <button className="btn-primary-hist" onClick={(e) => {
                              e.preventDefault();
                              setInfoMsg('');
                              reviewRental(listing);
                            }}>Review</button>
                            <button className="btn-primary-hist" onClick={(e) => {
                              e.preventDefault();
                              refundRental(listing);
                            }}>Request Refund</button>
                          </div>
                        </div>
                      </div>
                    </a>
                    <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
                      <Modal.Header closeButton>
                        <Modal.Title>Review</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <div className="model-body">
                          Rate the product:
                          <div className="star-rating">
                            {[...Array(5)].map((star, index) => {
                              index += 1;
                              return (
                                <button
                                  type="button"
                                  key={index}
                                  className={index <= (hover || rating) ? "on" : "off"}
                                  onClick={() => setRating(index)}
                                  onMouseEnter={() => setHover(index)}
                                  onMouseLeave={() => setHover(rating)}>
                                  <span className="star">&#9733;</span>
                                </button>
                              );
                            })}
                          </div>
                          Review the product:
                          <textarea style={{ width: '80%' }} rows='3' onChange={(e) => setReview(e.target.value)}></textarea>
                          <button className="submit-button" onClick={(e) => {
                            e.preventDefault();
                            submitReview(listing);
                          }}>Submit Review</button>
                          <p>{infoMsg}</p>
                        </div>
                      </Modal.Body>
                    </Modal>

                    <Modal show={showRefundModal} onHide={() => setShowRefundModal(false)} centered>
                      <Modal.Header closeButton>
                        <Modal.Title>Request a Refund</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <div className="model-body">
                          Reason for refund request:
                          <textarea style={{ width: '80%' }} rows='3' onChange={(e) => setRefundReason(e.target.value)}></textarea>
                          <button className="submit-button" onClick={(e) => {
                            e.preventDefault();
                            requestRefund(listing);
                          }}>Request Refund</button>
                          <p>{infoMsg}</p>
                        </div>
                      </Modal.Body>
                    </Modal>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default History