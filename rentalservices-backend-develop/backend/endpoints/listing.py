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

listing_bp = Blueprint('listing_bp', __name__)

def convertTime(tz_name, time):
    if time is None:
        return None
    tz_name = request.headers.get('Time-Zone')
    tz = pytz.timezone(tz_name)
    converted_time = time.replace(tzinfo=pytz.utc).astimezone(tz)
    converted_time =  converted_time.strftime('%m-%d-%Y %I:%M:%S %p')
    return converted_time

@listing_bp.route('/get_listing/<int:id>', methods=['GET'])
@cross_origin()
def get_listing(id):
    product = Product.query.filter_by(id=id).first()
    if product is None or product.is_approved == False :
        return jsonify({
            "error": "Product does not exist or has not been approved"
        })
    pictures = []
    owner_email = User.query.filter_by(id=product.owner).first().email
    for picture in product.pictures:
        filename = picture.filename
        #get the image data from picture table
        data = Picture.query.filter_by(filename = filename).first().bytes_data
        # Encode the image as a base64 string
        ext = os.path.splitext(filename)[1][1:].lower()
        content_type = f"image/{ext}"
        base64_data = base64.b64encode(data).decode('utf-8')

        pictures.append({
            "filename": filename,
            "data": base64_data
        })
    return jsonify({
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "category": product.category,
        "zipcode": product.zipcode,
        "duration": product.duration,
        "owner": owner_email,
        "pictures": pictures,
        "rating": product.rating,
        "id": product.id
    })

@listing_bp.route('/get_pending_listing/<int:id>', methods=['GET'])
@cross_origin()
def get_pending_listing(id):
    product = Product.query.filter_by(id=id, is_approved = False).first()
    if product is None:
        return jsonify({
            "error": "Product does not exist"
        })
    pictures = []
    owner_email = User.query.filter_by(id=product.owner).first().email
    for picture in product.pictures:
        filename = picture.filename
        #get the image data from picture table
        data = Picture.query.filter_by(filename = filename).first().bytes_data
        # Encode the image as a base64 string
        ext = os.path.splitext(filename)[1][1:].lower()
        content_type = f"image/{ext}"
        base64_data = base64.b64encode(data).decode('utf-8')

        pictures.append({
            "filename": filename,
            "data": base64_data
        })
    return jsonify({
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "category": product.category,
        "zipcode": product.zipcode,
        "duration": product.duration,
        "owner": owner_email,
        "pictures": pictures,
        "rating": product.rating,
        "id": product.id
    })

@listing_bp.route('/listings_for_owner', methods=['POST'])
@cross_origin()
def listings_for_owner():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                            'HS256'])['user_id']

    transactions = Transaction.query.filter_by(owner_id=user_id, is_active=True).all()
    rented = []
    pending = []
    upcoming = []
    available = []
    if transactions:
        for transaction in transactions:
            pictures = []
            product = Product.query.filter_by(id=transaction.product_id).first()
            owner_email = User.query.filter_by(id=product.owner).first().email
            for picture in product.pictures:
                filename = picture.filename
                #get the image data from picture table
                data = Picture.query.filter_by(filename = filename).first().bytes_data
                # Encode the image as a base64 string
                ext = os.path.splitext(filename)[1][1:].lower()
                content_type = f"image/{ext}"
                base64_data = base64.b64encode(data).decode('utf-8')


                pictures.append({
                    "filename": filename,
                    "data": base64_data
                })
            now_utc = datetime.now(pytz.utc)
            start = transaction.start_date.replace(tzinfo=pytz.utc)
            end = transaction.end_date.replace(tzinfo=pytz.utc)
            if start <= now_utc <= end:
                rented.append({
                    "t_id": transaction.id,
                    "name": product.name,
                    "description": product.description,
                    "price": product.price,
                    "category": product.category,
                    "zipcode": product.zipcode,
                    "duration": product.duration,
                    "owner": owner_email,
                    "pictures": pictures,
                    "rating": product.rating,
                    "p_id": product.id     
                })
            elif start > now_utc:
                upcoming.append({
                    "t_id": transaction.id,
                    "name": product.name,
                    "description": product.description,
                    "price": product.price,
                    "category": product.category,
                    "zipcode": product.zipcode,
                    "duration": product.duration,
                    "owner": owner_email,
                    "pictures": pictures,
                    "rating": product.rating,
                    "p_id": product.id     
                })
    
    available_prods = Product.query.filter_by(owner=user_id, is_approved=True).all()
    if available_prods:
        for product in available_prods:
            pictures = []
            owner_email = User.query.filter_by(id=product.owner).first().email
            for picture in product.pictures:
                filename = picture.filename
                #get the image data from picture table
                data = Picture.query.filter_by(filename = filename).first().bytes_data
                # Encode the image as a base64 string
                ext = os.path.splitext(filename)[1][1:].lower()
                content_type = f"image/{ext}"
                base64_data = base64.b64encode(data).decode('utf-8')


                pictures.append({
                    "filename": filename,
                    "data": base64_data
                })
            available.append({
                "name": product.name,
                "description": product.description,
                "price": product.price,
                "category": product.category,
                "zipcode": product.zipcode,
                "duration": product.duration,
                "owner": owner_email,
                "pictures": pictures,
                "rating": product.rating,
                "id": product.id
            })
            
    pending_prods = Product.query.filter_by(owner=user_id, is_approved=False).all()
    if pending_prods:
        for product in pending_prods:
            pictures = []
            owner_email = User.query.filter_by(id=product.owner).first().email
            for picture in product.pictures:
                filename = picture.filename
                #get the image data from picture table
                data = Picture.query.filter_by(filename = filename).first().bytes_data
                # Encode the image as a base64 string
                ext = os.path.splitext(filename)[1][1:].lower()
                content_type = f"image/{ext}"
                base64_data = base64.b64encode(data).decode('utf-8')


                pictures.append({
                    "filename": filename,
                    "data": base64_data
                })
            pending.append({
                "name": product.name,
                "description": product.description,
                "price": product.price,
                "category": product.category,
                "zipcode": product.zipcode,
                "duration": product.duration,
                "owner": owner_email,
                "pictures": pictures,
                "rating": product.rating,
                "p_id": product.id
            })
   
    return jsonify({
        "rented": rented,
        "pending": pending, 
        "available": available,
        "upcoming": upcoming,
    })

@listing_bp.route('/listings_for_renter', methods=['POST'])
@cross_origin()
def listings_for_renter():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                            'HS256'])['user_id']
    tz = request.headers.get('Time-Zone')

    transactions = Transaction.query.filter_by(renter_id=user_id, is_active = True).all()
    current = []
    past = []
    upcoming = []
    if transactions:
        for transaction in transactions:
            pictures = []
            product = Product.query.filter_by(id=transaction.product_id).first()
            owner_email = User.query.filter_by(id=product.owner).first().email
            for picture in product.pictures:
                filename = picture.filename
                #get the image data from picture table
                data = Picture.query.filter_by(filename = filename).first().bytes_data
                # Encode the image as a base64 string
                ext = os.path.splitext(filename)[1][1:].lower()
                content_type = f"image/{ext}"
                base64_data = base64.b64encode(data).decode('utf-8')


                pictures.append({
                    "filename": filename,
                    "data": base64_data
                })
            is_due = transaction.payments_remaining >= 1
            on_payment = transaction.payments_required - transaction.payments_remaining
            due_date = None
            if is_due:
                if(transaction.duration == 'Hourly'):
                    due_date = transaction.start_date + timedelta(hours=1*on_payment)
                elif(transaction.duration == 'Daily'):
                    due_date = transaction.start_date + timedelta(days=1*on_payment)
                elif(transaction.duration == 'Weekly'):
                    due_date = transaction.start_date + timedelta(weeks=1*on_payment)
                elif(transaction.duration == 'Monthly'):
                    due_date = transaction.start_date + timedelta(weeks=4*on_payment)
                elif(transaction.duration == 'Yearly'):
                    due_date = transaction.start_date + timedelta(weeks=52*on_payment)

            now_utc = datetime.now(pytz.utc)
            start = transaction.start_date.replace(tzinfo=pytz.utc)
            end = transaction.end_date.replace(tzinfo=pytz.utc)
            if start <= now_utc <= end:
                current.append({
                    "t_id": transaction.id,
                    "is_cancelled":transaction.is_cancelled,  #avbhamid
                    "name": product.name,
                    "description": product.description,
                    "price": product.price,
                    "category": product.category,
                    "zipcode": product.zipcode,
                    "duration": product.duration,
                    "owner": owner_email,
                    "pictures": pictures,
                    "rating": product.rating,
                    "p_id": product.id,
                    "due": is_due,
                    "due_date": convertTime(tz,due_date),
                    "start": convertTime(tz,transaction.start_date),
                    "end": convertTime(tz,transaction.end_date),
                    "remaining": transaction.payments_remaining,
                })
            elif end < now_utc:
                past.append({
                    "t_id": transaction.id,
                    "is_cancelled":transaction.is_cancelled,  #avbhamid
                    "name": product.name,
                    "description": product.description,
                    "price": product.price,
                    "category": product.category,
                    "zipcode": product.zipcode,
                    "duration": product.duration,
                    "owner": owner_email,
                    "pictures": pictures,
                    "rating": product.rating,
                    "p_id": product.id,
                    "due": is_due,
                    "due_date": convertTime(tz,due_date),
                    "start": convertTime(tz,transaction.start_date),
                    "end": convertTime(tz,transaction.end_date),
                    "remaining": transaction.payments_remaining,
                })
            elif start > now_utc:
                upcoming.append({
                    "t_id": transaction.id,
                    "is_cancelled":transaction.is_cancelled,  #avbhamid
                    "name": product.name,
                    "description": product.description,
                    "price": product.price,
                    "category": product.category,
                    "zipcode": product.zipcode,
                    "duration": product.duration,
                    "owner": owner_email,
                    "pictures": pictures,
                    "rating": product.rating,
                    "p_id": product.id,
                    "due": is_due,
                    "due_date": convertTime(tz,due_date),
                    "start": convertTime(tz,transaction.start_date),
                    "end": convertTime(tz,transaction.end_date),
                    "remaining": transaction.payments_remaining,   
                })
            
    return jsonify({
        "current": current,
        "past": past, 
        "upcoming": upcoming
    })
    
@listing_bp.route('/is_owner', methods=['POST'])
@cross_origin()
def is_owner():
    token = request.json.get('token')
    product_id = request.json.get('id')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                            'HS256'])['user_id']
    product = Product.query.filter_by(id=product_id).first()
    if product is None:
        return jsonify({
            "error": "Product does not exist"
        })
    if product.owner == user_id:
        return jsonify({
            "owner": True
        })
    else:
        return jsonify({
            "owner": False
        })

