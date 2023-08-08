import React from 'react'
import ReCAPTCHA from "react-google-recaptcha"
import "./Recaptcha.css"

const Recaptcha = () => {

  function onChange() {
    window.location.href = '/';
  }

  return(
    <div className='recaptcha'>
      <ReCAPTCHA
        sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
        onChange={onChange}
      />
    </div>
  )
}

export default Recaptcha;