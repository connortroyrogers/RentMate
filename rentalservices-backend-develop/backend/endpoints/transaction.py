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

mail = Mail(app)

transaction_bp = Blueprint('transaction_bp', __name__)

def send_email(to, subject, body):
    msg = Message(subject, recipients=[to])
    msg.body = body
    mail.send(msg)

def convertTime(tz_name, time):
    tz_name = request.headers.get('Time-Zone')
    tz = pytz.timezone(tz_name)
    converted_time = time.replace(tzinfo=pytz.utc).astimezone(tz)
    converted_time =  converted_time.strftime('%m-%d-%Y %I:%M:%S %p')
    return converted_time

@transaction_bp.route('/get_promo', methods=['POST'])
@cross_origin()
def get_promo():
    promo_code = request.json.get('promo').lower()
    if(promo_code == '' or promo_code == None):
        return jsonify({
            "null": "Promo code is null"
        })
    promo = Promo.query.filter_by(code=promo_code).first()      
    if promo is None:
        return jsonify({
            "error": "Promo code is not valid"
        })
    return jsonify({
        "success": "Promo code applied",
        "discount": promo.discount
    })

@transaction_bp.route('/complete_transaction', methods=['POST'])
@cross_origin()
def complete_transaction():
    token = request.json.get('token')
    renter_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                         'HS256'])['user_id']
    renter_email = User.query.filter_by(id=renter_id).first().email
    owner_email = request.json.get('owner_email')
    owner_id = User.query.filter_by(email=owner_email).first().id
    product_id = request.json.get('product_id')
    promo = request.json.get('promo').lower()
    duration = request.json.get('duration')
    start_date = request.json.get('start_date')
    end_date = request.json.get('end_date')
    initial_payment = request.json.get('payment')
    payments_remaining = request.json.get('payments_remaining')
    balance_remaining = request.json.get('balance_remaining')
    renter_address = request.json.get('renter_address')
    renter_zipcode = request.json.get('renter_zipcode')
    tz = request.headers.get('Time-Zone')

    #check for overalapping start and end dates
    start_date = datetime.strptime(start_date, '%Y-%m-%dT%H:%M:%S.%fZ')
    end_date = datetime.strptime(end_date, '%Y-%m-%dT%H:%M:%S.%fZ')
    transactions = Transaction.query.filter_by(product_id = product_id).all()
    for transaction in transactions:
        if((transaction.start_date <= start_date and transaction.end_date >= start_date) or (transaction.start_date <= end_date and transaction.end_date >= end_date) or (transaction.start_date >= start_date and transaction.end_date <= end_date)):
            overlapped_start = convertTime(tz, transaction.start_date)
            overlapped_end = convertTime(tz, transaction.end_date)
            return jsonify({
                "overlap": f"This product is already being rented from {overlapped_start} to {overlapped_end}"
            })
            
    product = Product.query.filter_by(id=product_id).first()
    if product is None:
        return jsonify({
            "error": "Error with product"
        })
    transaction = Transaction(renter_id=renter_id, owner_id=owner_id, product_id=product_id, promo=promo, duration=duration, start_date=start_date, end_date=end_date, initial_payment=initial_payment, 
    payments_remaining=payments_remaining, renter_address=renter_address, renter_zipcode=renter_zipcode, balance_remaining = balance_remaining, amount_paid_to_date=initial_payment, payments_required = payments_remaining + 1)
    db.session.add(transaction)
    db.session.commit()
    msg_to_renter = f"Thank you for renting {product.name} from {owner_email}!\nYour rental will begin on {convertTime(tz,start_date)} and end on {convertTime(tz,end_date)}. Transaction ID: {transaction.id}"
    msg_to_owner = f"{renter_email} has rented {product.name} from you!\nYour rental will begin on {convertTime(tz,start_date)} and end on {convertTime(tz,end_date)}."
    try:
        send_email(renter_email, "Transaction Completed", msg_to_renter)
        send_email(owner_email, "Transaction Completed", msg_to_owner)
    except:
        return jsonify({
            "email_error": "Error sending emails"
        })

    date = convertTime(tz,datetime.now())
    date = date.split(" ")
    date = date[0]

    return jsonify({
        "success": "Transaction completed",
        "id": transaction.id,
        "start_date": convertTime(tz,start_date),
        "end_date": convertTime(tz,end_date),
        "owner": owner_email,
        "renter": renter_email,
        "product": product.name,
        "initial_payment": initial_payment,
        "date": date,
        "remaining": payments_remaining,
    })


@transaction_bp.route('/request_refund', methods=['POST'])
@cross_origin()
def refund_request():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                         'HS256'])['user_id']
    transaction_id = request.json.get('transaction_id')
    transaction = Transaction.query.filter_by(id=transaction_id).first()
    reason = request.json.get('reason')
    if transaction is None:
        return jsonify({
            "error": "Error with transaction"
        })
    if transaction.requested_refund:
        return jsonify({
            "exists": "Refund already requested for this transaction"
        })
    transaction.requested_refund = True
    transaction.refund_reason = reason
    db.session.commit()
    return jsonify({
        "success": "Refund requested",
    })

#Cancel rental bookings - avbhamid

@transaction_bp.route('/cancel_booking', methods=['POST'])
@cross_origin()
def cancel_booking():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                         'HS256'])['user_id']
    transaction_id = request.json.get('transaction_id')
    transaction = Transaction.query.filter_by(id=transaction_id).first()
    if transaction is None:
        return jsonify({
            "error": "Error with transaction"
        })
    if transaction.is_cancelled:
        return jsonify({
            "exists": "Already Cancelled"
        })
    transaction.is_cancelled = True
    db.session.commit()
    return jsonify({
        "success": "Cancelled successfully",
    })

#Get all refund requests
@transaction_bp.route('/get_refund_requests', methods=['POST'])
@cross_origin()
def get_refund_requests():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                         'HS256'])['user_id']
    user = User.query.filter_by(id=user_id).first()
    requests = []
    if user.role != 'admin':
        return jsonify({
            "error": "User is not an admin"
        })
    transactions = Transaction.query.filter_by(requested_refund=True).all()
    if transactions is None:
        return jsonify({
            "null": "No refund requests"
        })

    else:
        for transaction in transactions:
            user = User.query.filter_by(id=transaction.renter_id).first()
            product = Product.query.filter_by(id=transaction.product_id).first()
            requests.append({
                "t_id": transaction.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "email": user.email,
                "amount": transaction.amount_paid_to_date,
                "reason": transaction.refund_reason
            })
    return jsonify({
        "requests": requests
    })


@transaction_bp.route('/approve_refund', methods=['POST'])
@cross_origin()
def approve_refund():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                         'HS256'])['user_id']
    user = User.query.filter_by(id=user_id).first()
    if user.role != 'admin':
        return jsonify({
            "error": "User is not an admin"
        })
    transaction_id = request.json.get('transaction_id')
    transaction = Transaction.query.filter_by(id=transaction_id).first()
    if transaction is None:
        return jsonify({
            "error": "Error with transaction"
        })
    transaction.requested_refund = False
    transaction.is_refunded = True
    transaction.is_active = False
    renter = User.query.filter_by(id=transaction.renter_id).first().email
    try:
        send_email(renter, "Refund Approved", "Your refund has been approved for transaction #" + str(transaction.id) + ".")
    except:
        return jsonify({
            "email_error": "Error sending email"
        })
    db.session.commit()
    return jsonify({
        "success": "Refund approved"
    })

@transaction_bp.route('/deny_refund', methods=['POST'])
@cross_origin()
def deny_refund():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                         'HS256'])['user_id']
    user = User.query.filter_by(id=user_id).first()
    if user.role != 'admin':
        return jsonify({
            "error": "User is not an admin"
        })
    transaction_id = request.json.get('transaction_id')
    transaction = Transaction.query.filter_by(id=transaction_id).first()
    if transaction is None:
        return jsonify({
            "error": "Error with transaction"
        })
    transaction.requested_refund = False
    transaction.is_refunded = False
    db.session.commit()
    renter = User.query.filter_by(id=transaction.renter_id).first().email
    try:
        send_email(renter, "Refund Denied", "Your refund has been denied for transaction #"+str(transaction.id)+".")
    except:
        return jsonify({
            "email_error": "Error sending email"
        })
    return jsonify({
        "success": "Refund denied"
    })

@transaction_bp.route('/make_payment', methods=['POST'])
@cross_origin()
def make_payment():
    token = request.json.get('token')
    tz = request.headers.get('Time-Zone')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                         'HS256'])['user_id']
    transaction_id = request.json.get('transaction_id')
    transaction = Transaction.query.filter_by(id=transaction_id).first()
    product = Product.query.filter_by(id=transaction.product_id).first()
    if transaction is None:
        return jsonify({
            "error": "Transaction not found"
        })
    owner_email = User.query.filter_by(id=transaction.owner_id).first().email
    renter_email = User.query.filter_by(id=transaction.renter_id).first().email
    payment = product.price
    if transaction.payments_remaining == 0:
        return jsonify({
            "no_payment": "No payments remaining"
        })
    transaction.payments_remaining -= 1
    transaction.amount_paid_to_date += payment
    transaction.balance_remaining -= payment
    db.session.commit()
    renter = User.query.filter_by(id=transaction.renter_id).first().email
    owner = User.query.filter_by(id=transaction.owner_id).first().email
    try:
        send_email(renter, "Payment Made", "Your payment for transaction #" + str(transaction.id) + " has been processed.")
        send_email(owner, "Payment Made", "Your renter for transaction #" + str(transaction.id) + " has made a payment.")
    except:
        return jsonify({
            "email_error": "Error sending email"
        })
    date = convertTime(tz,datetime.now())
    date = date.split(" ")
    date = date[0]
    return jsonify({
        "success": "Payment made",
        "id": transaction.id,
        "start_date": convertTime(tz,transaction.start_date),
        "end_date": convertTime(tz,transaction.end_date),
        "owner": owner_email,
        "renter": renter_email,
        "product": product.name,
        "initial_payment": transaction.initial_payment,
        "date": date,
        "remaining": transaction.payments_remaining,
        "price": product.price,
    })


