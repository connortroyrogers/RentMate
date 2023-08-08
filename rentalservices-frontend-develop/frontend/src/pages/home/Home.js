import React, {useState, useEffect, useRef}  from 'react'
import SpeechRecognition , {useSpeechRecognition} from 'react-speech-recognition'
import './Home.css'
import 'bootstrap/dist/css/bootstrap.css';
import { ClipLoader } from 'react-spinners';
import { AiOutlineOrderedList } from 'react-icons/ai';

const Home = () => {
  const inputRef = useRef(null);
  const [item, setItem] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [ownerList, setOwnerList] = useState([]);
  const [ratingsList, setRatingsList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [recommendedList, setRecommendedList] = useState([]);
  const [initialProductList, setInitialProductList] = useState([]);
  const [checkedOwnerList, setOwnerCheckedList] = useState([]);
  const [checkedRatingList, setRatingCheckedList] = useState([]);
  const [resultsMsg, setResultsMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const apiUrl = process.env.REACT_APP_API_URL;

  const [inputMode, setInputMode] = useState('text');
  const {
    transcript,
    listening,
    resetTranscript,

  } = useSpeechRecognition()

  const handleSpeechRecognition = () => {
    if (inputMode === 'voice') {
      SpeechRecognition.startListening({ continuous: true });
      setTimeout(() => {
        if (SpeechRecognition.listening()) {
          console.log('Started listening...');
        } else {
          console.log('Failed to start listening.');
        }
      }, 500); // add a delay of 500 milliseconds
    }
  };

  const handleBlur = () => {
    if (inputMode === 'voice') {
      SpeechRecognition.stopListening();
      setItem(transcript);
    }
  };

  const itemTypes= [
    { label: 'All', value: 'All' },
    { label: 'Housing', value: 'Housing' },
    { label: 'Vehicles', value: 'Vehicles' },
    { label: 'Services', value: 'Services' },
  ]
  

   const handleTypeChange = (event) => {
    setType(event.target.value);
  };

  const ownerOnChange = (event) => {
    const value = event.target.value;
    const isChecked = event.target.checked;
 
    let newList = []
    if (isChecked) {
      newList  = [...checkedOwnerList, value]
      setOwnerCheckedList(newList);
    } else {
      newList = checkedOwnerList.filter((item) => item !== value);
      setOwnerCheckedList(newList);
    }
    let filterOwner
    if (newList.length != 0){
      filterOwner = initialProductList.filter((data) => (newList.includes(data.owner)));
    }
    else{
      filterOwner = initialProductList
    }
    if(checkedRatingList.length != 0){
      const filterRating = filterOwner.filter((data) => (checkedRatingList.includes(data.rating)));
      setProductList(filterRating)
    }
    else{
      setProductList(filterOwner)
    }
  };

  const ratingOnChange = (event) => {
    const value = event.target.value;
    const isChecked = event.target.checked;
    let newList = []
    if (isChecked) {
      newList = [...checkedRatingList, value]
      setRatingCheckedList(newList);
    } else {
      newList = checkedRatingList.filter((item) => item !== value);
      setRatingCheckedList(newList);
    }
    let filterRating
    if (newList.length != 0){
      filterRating = initialProductList.filter((data) => (newList.includes(data.rating.toString())));
    }
    else{
      filterRating = initialProductList
    }
    if(checkedOwnerList.length != 0){
      const filterOwner = filterRating.filter((data) => (checkedOwnerList.includes(data.owner)));
      setProductList(filterOwner)
    }
    else{
      setProductList(filterRating)
    }
  };

    const searchItems = (event) => {
      event.preventDefault();
      const formData = new FormData();
        formData.append('search', item);
        formData.append('searchLoc', location);
        formData.append('requestCategory', type);
        formData.append('token', token);

        const userInfo = {
          method: 'POST',
          body: formData
        };

        fetch(`${apiUrl}/search`, userInfo)
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              console.log(data.error);
            } else {
              const searchPromises = data.results.map(id => {
                const listingInfo = {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                };
                return fetch(`${apiUrl}/get_listing/${id}`, listingInfo)
                  .then(response => response.json());
              });
              Promise.all(searchPromises)
                .then(listings => {
                  setProductList(listings)
                  setInitialProductList(listings)
                  if(listings.length === 0)
                    setResultsMsg("No results found")
                  else
                    setResultsMsg("")
                  const olist = []
                  const rlist = []
                  listings.forEach(product => {
                    if (olist.indexOf(product.owner) === -1) {
                      olist.push(product.owner)
                    }
                  });
                  setOwnerList(olist)
                  listings.forEach(product => {
                    if (rlist.indexOf(product.rating) === -1 && product.rating != null) {
                      rlist.push(product.rating)
                    }
                  });
                  rlist.sort((a, b) => b - a)
                  setRatingsList(rlist) 
                })
                .catch(error => console.error(error))
                .finally(() => {
                  
                });
            }
          })
          .catch(error => console.error(error));
      }
      
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

  fetch(`${apiUrl}/recommended_products`, userInfo)
    .then(response => response.json())
    .then(data => {
      if (data.results && data.results.length > 0) {
        setRecommendedList(data.results);
      } 
      else if (data.top && data.top.length > 0) {
        setRecommendedList(data.top);
      }
    })
    .catch(error => console.error(error));
}, []);

const [currentCards, setCurrentCards] = useState([]);
useEffect(() => {
  if (recommendedList.length == 0) {
    return;
  }
  const intervalId = setInterval(() => {
    const first = recommendedList.shift();
    recommendedList.push(first);
    setCurrentCards(recommendedList.slice(0, 3));
    setLoading(false)
  }, 3000);

  return () => clearInterval(intervalId);
}, [recommendedList]);


  return (
    <div>
    <form className = 'search_form' action="#" method="post" onSubmit={searchItems}>
      <h1>Search For Rentals</h1>
      <div className="row">
        <label className='col-md-2 dropdown_label'>
        <select value={type} onChange={handleTypeChange} className='type_dropdown'>
          {itemTypes.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        </label>
        {inputMode === 'text' ? (
          <input ref={inputRef} className = 'search-item col-md-3' type="text" value={item} placeholder = 'Search item' onChange={e => setItem(e.target.value)} onBlur={handleBlur} autoFocus/>
          ) : (
          <input ref={inputRef} className = 'search-item col-md-3' type="text" value={transcript} placeholder = 'Search item' onChange={e => setItem(e.target.value)} onBlur={handleBlur} onFocus={handleSpeechRecognition} autoFocus required/>
          )
        }
        <button className = 'toggle_input_button col-md-1' type = "button" onClick={() => {setInputMode(inputMode === 'text' ? 'voice' : 'text'); 
            resetTranscript();
            setItem('');
            inputRef.current.blur(); 
            setTimeout(() => {
              inputRef.current.focus(); // then focus it again after a short delay
            }, 100);
          }}>
          {inputMode === 'text' ? <img style={{height: "30px", width: "auto"}} src={require('../../images/mic-muted.png')} alt='mic-muted'/> : <img style={{height: "30px", width: "auto"}} src={require('../../images/mic-unmuted.png')} alt='mic-unmuted'/>}
        </button>
        <input className = 'search-zip col-md-3' type="text" placeholder = 'Zipcode' id="location" name="location" value={location} onChange={(e) => setLocation(e.target.value)} required></input>
        <button className='search_button col-md-2' type="submit">Search</button>
        {resultsMsg && <div className='results-msg'>{resultsMsg}</div>}
      </div>
    </form>

    
    <div className='row'>
      <div className='col-md-2'>
        {ownerList.length > 0 &&
        <div className='filter-label'>Owner:</div>}
        <div className='filter-options'>
          {ownerList.map((item, index) => (
        <div key={index}>
          <input value={item} type="checkbox" onChange={ownerOnChange}/>
          <span className='label'>{item}</span>
        </div>
      ))}
      </div>
     
      {ratingsList.length > 0 &&
      <div className='filter-label'>Ratings:</div>}
      <div className='filter-options'>
        {ratingsList.map((item, index) => (
        <div key={index}>
          <input value={item} type="checkbox" onChange={ratingOnChange}/>
          <span className='label'>{item}</span>
        </div>
        ))}
      </div>   
      </div>

      <div style = {{padding: '20px 20px'}}>
        <div className='row-rec'>
          {productList.map((prod, index) => (
            <div key={index} className = 'col-md-2-search'>
            <a href={`listing/${prod.id}`} className="card-link">
            <div className="card" >
              {prod.pictures && prod.pictures.length > 0 && <img src={`data:${prod.pictures[0].mime};base64,${prod.pictures[0].data}`} alt={prod.name} className = 'image-card'/>} 
              <div className="card-body">
                <h5 className="card-title">{prod.name}</h5>
                <p className="card-text">{prod.description.slice(0, 30)}{prod.description.length > 30 && "..."}</p>
                <p className="card-text">${prod.price} {prod.duration}</p>
              </div>
            </div>
          </a>
          </div>
          ))}
          </div>
          </div>
      
    
        <div className="recommendations-rec" >
        {loading ? (
          <div className='rentals-container'>
            <ClipLoader size={100} color={'#123abc'} loading={loading} />
          </div>
          ) : (
          <>
          {token && <h2 className = 'sub-title-rec'>Recommendations</h2>}
          {!token && <h2 className = 'sub-title-rec'>Top Rentals</h2>}
          <div className='row-rec' style={{ overflowX: "hidden", whiteSpace: "nowrap", transition: "transform 1s ease" }}>
          {currentCards.map((recom, index) => (
              <div key={index} className={`rec-search`}>
              <a href={`listing/${recom.id}`} className="card-link">
              <div className="card" >
                {recom.pictures && recom.pictures.length > 0 && <img src={`data:${recom.pictures[0].mime};base64,${recom.pictures[0].data}`} alt={recom.name} className = 'image-card'/>} 
                <div className="card-body">
                  <h5 className="card-title">{recom.name}</h5>
                  <p className="card-text">{recom.description.slice(0, 30)}{recom.description.length > 30 && "..."}</p>
                  <p className="card-text">${recom.price} {recom.duration}</p>
                </div>
              </div>
            </a>
          </div>
        ))}
        </div>
        </>
        )}
      </div>
    </div>
  </div>
  )
}

export default Home