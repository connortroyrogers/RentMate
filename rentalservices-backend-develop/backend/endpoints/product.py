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
from io import BytesIO
product_bp = Blueprint('product_bp', __name__)

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif'}

#checks that file has proper format and is correct file type
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@product_bp.route('/newproduct', methods=['POST'])
@cross_origin()
def newproduct():
    token = request.form['token']
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])['user_id']
    name = request.form['name']
    description = request.form['description']
    price = request.form['price']
    category = request.form['category']
    zipcode = request.form['zipcode']
    duration = request.form['rentalDuration']
    owner = user_id
    pictures = []
    try:
        for image in request.files.getlist('images'):
            if image and allowed_file(image.filename):
                filename = secure_filename(image.filename)
                image_bytes = image.read()
                picture = Picture(filename=filename, bytes_data=image_bytes)
                pictures.append(picture)
        product = Product(name=name, description=description, price=price, category=category, zipcode=zipcode, duration=duration, owner=owner, pictures=pictures)
        db.session.add(product)
        db.session.commit()   
        return jsonify({
            "message": "Your listing has been submitted for approval."
        })
    except Exception as e:
        return jsonify({
            "error": "An error occurred with submitting your listing."
        })


@product_bp.route('/product/<int:product_id>/review', methods=['POST'])
@cross_origin()
def add_review(product_id):
    # get the product that the review is for
    product = Product.query.get(product_id)
    
    # get user object from the session or the request data
    token = request.form['token']
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])['user_id']


    # check if the user has already reviewed the product
    existing_review = Review.query.filter_by(product_id=product.id, user_id=user_id).first()
    if existing_review:
        return jsonify({
            "message": "You have already reviewed this product."
        })
    # get the rating and comment from the request data
    rating = request.form['rating']
    comment = request.form['comment']

    # create a new review object
    review = Review(rating=rating, comment=comment, product_id=product_id, user_id=user_id)

    # add the review to the database
    db.session.add(review)
    db.session.commit()

    # calculate the new product rating based on all the reviews
    product.set_rating(rating)

    return redirect(url_for('product_detail', product_id=product_id))
    
    
@product_bp.route('/edit_product', methods=['POST'])
@cross_origin()
def edit_product():
    token = request.form['token']
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])['user_id']
    product_id = request.form['id']
    name = request.form['name']
    description = request.form['description']
    price = request.form['price']
    category = request.form['category']
    zipcode = request.form['zipcode']
    duration = request.form['duration']
    pictures = []
    try:
        product = Product.query.filter_by(id=product_id).first()
        product.name = name
        product.description = description
        product.price = price
        product.category = category
        product.zipcode = zipcode
        product.duration = duration
        if(request.files.getlist('images') != []):
            for picture in product.pictures:
                db.session.delete(picture)
            db.session.commit()

            for image in request.files.getlist('images'):
                if image and allowed_file(image.filename):
                    filename = secure_filename(image.filename)
                    image_bytes = image.read()
                    picture = Picture(filename=filename, bytes_data=image_bytes)
                    pictures.append(picture)
            product.pictures = pictures
        db.session.commit()
            
        return jsonify({
            "message": "Your listing has been edited successfully."
        })
    except Exception as e:
        return jsonify({
            "error": "An error occurred with editing your listing."
        })
