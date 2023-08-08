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

user_bp = Blueprint('user_bp', __name__)

def convertTime(tz_name, time):
    tz_name = request.headers.get('Time-Zone')
    tz = pytz.timezone(tz_name)
    converted_time = time.replace(tzinfo=pytz.utc).astimezone(tz)
    converted_time =  converted_time.strftime('%m-%d-%Y %I:%M:%S %p')
    return converted_time

@user_bp.route('/user_info', methods=['POST'])
@cross_origin()
def user_info():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                         'HS256'])['user_id']

    user = User.query.filter_by(id=user_id).first()
    return jsonify({
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "phone": user.phone,
        "password_hash": user.password_hash
    })


@user_bp.route('/edit_user_info', methods=['POST'])
@cross_origin()
def update_user_info():
    try:
        token = request.json.get('token')
        user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
            'HS256'])['user_id']
        user = User.query.filter_by(id=user_id).first()
        user.first_name = request.json.get('firstName').capitalize()
        user.last_name = request.json.get('lastName').capitalize()
        user.email = request.json.get('email').lower()
        user.phone = request.json.get('phone')
        db.session.commit()
        return jsonify({
            "message": "User details updated successfully"
        })
    except:
        return jsonify({
            "error": "An error occurred with updating your details"
        })

@user_bp.route('/user_role', methods=['POST'])
@cross_origin()
def user_role():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                         'HS256'])['user_id']
    user = User.query.filter_by(id=user_id).first()
    if(user == None):
        return jsonify({
            "error": "User does not exist"
        })
    return jsonify({
        "role": user.role
    })

@user_bp.route('/request_owner', methods=['POST'])
@cross_origin()
def request_owner():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                            'HS256'])['user_id']
    user = User.query.filter_by(id=user_id).first()
    user.requested_owner_role = True
    db.session.commit()
    return jsonify({
        "success": "Request sent"
    })

@user_bp.route('/renter_information', methods=['POST'])
@cross_origin()
def renter_information():
    transaction_id = request.json.get('transaction_id')
    tz = request.headers.get('Time-Zone')
    transaction = Transaction.query.filter_by(id = transaction_id).first()
    renter = User.query.filter_by(id=transaction.renter_id).first()
    return jsonify({
        "name": renter.first_name + " " + renter.last_name,
        "email": renter.email,
        "phone": renter.phone,
        "address": transaction.renter_address,
        "zipcode": transaction.renter_zipcode,
        "start_date": convertTime(tz,transaction.start_date),
        "end_date": convertTime(tz,transaction.end_date),
        "payments_remaining": transaction.payments_remaining,
    })