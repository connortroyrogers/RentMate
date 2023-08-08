import os, random, jwt, pytz, traceback, base64
from flask import Flask, Blueprint, request, jsonify, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS, cross_origin
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash
from twilio.rest import Client
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask_mail import Mail, Message
from app import db, app
from models import *

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/send_otp', methods=['POST'])
@cross_origin()
def send_otp():
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    service_sid = os.environ.get('TWILIO_SERVICE_SID')
    client = Client(account_sid, auth_token)
    email = request.json.get('email')
    user = User.query.filter_by(email=email).first()
    otp_verification = client.verify.services(service_sid).verifications.create(
        to='+1{}'.format(user.phone), channel='sms')
    return jsonify({
        "message": "Your verification passcode has been sent to the phone number ******" + user.phone[-4:]
    })


@auth_bp.route('/verify_email', methods=['POST'])
@cross_origin()
def verify_email():
    email = request.json.get('email')
    user = User.query.filter_by(email=email).first()
    if user is None:
        return jsonify({"error": "User does not exist"}), 401
    return jsonify({
        "message": "success",
        "securityQuestion": user.security_question
    })


@auth_bp.route('/verify_otp', methods=['POST'])
@cross_origin()
def verify_otp():
    otp_code = request.json.get('verificationCode')
    email = request.json.get('email')
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    service_sid = os.environ.get('TWILIO_SERVICE_SID')
    client = Client(account_sid, auth_token)
    user = User.query.filter_by(email=email).first()
    verification_check = client.verify.services(service_sid).verification_checks.create(
        to='+1{}'.format(user.phone), code=otp_code)
    if verification_check.status == 'approved':
        return jsonify({
            "message": "success"
        })
    else:
        return jsonify({
            "error": "The code you entered is incorrect"
        })
