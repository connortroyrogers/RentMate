import os, random, jwt, pytz, traceback, base64, requests
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

account_bp = Blueprint('account_bp', __name__)

@account_bp.route('/signup', methods=['POST'])
@cross_origin()
def signup():
    data = request.get_json()
    first_name = data['firstName'].capitalize()
    last_name = data['lastName'].capitalize()
    email = data['email']
    phone = data['phone']
    password_hash = generate_password_hash(data['password'])
    security_question = data['securityQuestion']
    security_answer = data['securityAnswer']

    user_exists = User.query.filter_by(email=email).first() is not None
    if user_exists:
        return jsonify({"error": "User already exists"}), 409

    phone_exists = User.query.filter_by(phone=phone).first() is not None
    if phone_exists:
        return jsonify({"error": "This phone number is already associated with an account"}), 409

    user = User(first_name=first_name, last_name=last_name, email=email, phone=phone,
                password_hash=password_hash, security_question=security_question, security_answer=security_answer)
    db.session.add(user)
    db.session.commit()
    response = requests.post('https://api.chatengine.io/users/',
        data={
            "username": email,
            "secret": password_hash,
            "email": email,
            "first_name": first_name,
            "last_name": last_name
        },
        headers={ "Private-Key": os.environ.get('CHAT_ENGINE_PRIVATE_KEY')}
    )
    return jsonify({
        "id": user.id,
        "email": user.email,
        "password_hash": user.password_hash
    })


@account_bp.route('/signin', methods=['POST'])
@cross_origin()
def sign_in():
    email = request.json.get('email')
    password = request.json.get('password')

    user = User.query.filter_by(email=email).first()
    if user is None:
        return jsonify({"error": "User does not exist"}), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Incorrect password"}), 401

    token = jwt.encode({'user_id': user.id},
                       app.config['SECRET_KEY'], algorithm='HS256')
    password_reset_time_dif = (
        datetime.now() - user.last_password_reset).total_seconds()
    response = requests.get('https://api.chatengine.io/users/me/',
        headers={
            "Project-ID": os.environ.get('CHAT_ENGINE_PROJECT_ID'),
            "User-Name": user.email,
            "User-Secret": user.password_hash
        }
    )
    return jsonify({
        "message": "User logged in",
        "id": user.id,
        "email": user.email,
        "password_reset_time_dif": password_reset_time_dif,
        "token": token.decode('UTF-8')
    })


@account_bp.route('/delete', methods=['DELETE'])
@cross_origin()
def delete():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                         'HS256'])['user_id']
    user = User.query.filter_by(id=user_id).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'})
    else:
        return jsonify({'error': 'User not found'})


@account_bp.route('/reset_password', methods=['POST'])
@cross_origin()
def reset_password():
    email = request.json.get('email')
    new_password = request.json.get('newPassword')
    user = User.query.filter_by(email = email).first()
    if user is None:
        return jsonify({"error": "User does not exist"}), 401
    user.password_hash = generate_password_hash(new_password)
    user.last_password_reset = datetime.now()
    db.session.commit()
    return jsonify({
        "message": "Password reset successful"
    })

@account_bp.route('/security_answer', methods=['POST'])
@cross_origin()
def security_answer():
    email = request.json.get('email')
    security_answer = request.json.get('securityAnswer')
    user = User.query.filter_by(email = email).first()
    if user.security_answer.strip().lower() != security_answer.strip().lower():
        return jsonify({"error": "Incorrect security answer"}), 401
    return jsonify({"message": "success"})
