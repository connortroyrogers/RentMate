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

search_bp = Blueprint('search_bp', __name__)

@search_bp.route('/search', methods=['POST'])
@cross_origin()
def search():
    #creates search query, category, and location
    searchQuery = request.form['search']
    searchCat = request.form['requestCategory']
    searchLoc = request.form['searchLoc']
    #creates query of type Product
    query = Product.query
    #adds all results that fit search to 'query' then filters by category and location
    if searchQuery:
        query = query.filter(Product.name.ilike(f'%{searchQuery}%'))

    if searchCat and searchCat != "All":
        query = query.filter_by(category = searchCat, is_approved = True)
        
    if searchLoc:
        query = query.filter_by(zipcode = searchLoc, is_approved = True)
    #creates list of all Products in query
    results = query.all()
    return jsonify({
        "results": [result.id for result in results],
    })

@search_bp.route('/recommended_products', methods=['POST'])
@cross_origin()
def recommended_products():
    token = request.json.get('token')
    top_list = []
    ids = set()
    ids_top = set()
    results_list = []
    if(token is not None and token != ''):
        user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                            'HS256'])['user_id']    
        transactions = Transaction.query.filter_by(renter_id=user_id).order_by(Transaction.id.desc()).limit(2).all()
        categories = []
        for transaction in transactions:
            product = Product.query.filter_by(id=transaction.product_id).first()
            categories.append(product.category)
        products = []
        for category in categories:
            products = Product.query.filter_by(category=category, is_approved = True).all()
            for product in products:
                if(product.id in ids):
                    continue
                else:
                    pictures = []
                    filename = product.pictures[0].filename
                    data = Picture.query.filter_by(filename = filename).first().bytes_data
                    ext = os.path.splitext(filename)[1][1:].lower()
                    content_type = f"image/{ext}"
                    base64_data = base64.b64encode(data).decode('utf-8')
                    pictures.append({
                        "filename": filename,
                        "data": base64_data
                    })

                    results_list.append({
                            "id": product.id,
                            "name": product.name,
                            "price": product.price,
                            "description": product.description,
                            "pictures": pictures
                    })
                    ids.add(product.id)
        results_list = results_list[:10]

    top_products = Product.query.filter_by(is_approved = True).order_by(Product.id.desc()).limit(20).all()
    for product in top_products:
        if(product.id in ids_top):
            continue
        else:
            pictures = []
            filename = product.pictures[0].filename
            data = Picture.query.filter_by(filename = filename).first().bytes_data
            ext = os.path.splitext(filename)[1][1:].lower()
            content_type = f"image/{ext}"
            base64_data = base64.b64encode(data).decode('utf-8')
            pictures.append({
                "filename": filename,
                "data": base64_data
            })

            top_list.append({
                    "id": product.id,
                    "name": product.name,
                    "price": product.price,
                    "description": product.description,
                    "pictures": pictures
            })
            ids_top.add(product.id)

    while len(results_list) < 10 and top_list:
        top_product = top_list.pop(0)
        if top_product['id'] not in ids:
            results_list.append(top_product)
            ids.add(top_product['id'])

    return jsonify({
        "results": results_list,
        "top": top_list
    })
