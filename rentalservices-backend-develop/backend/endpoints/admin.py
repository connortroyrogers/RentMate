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

admin_bp = Blueprint('admin_bp', __name__)

@admin_bp.route('/approve_owner', methods=['POST'])
@cross_origin()
def approve_owner():
    token = request.json.get('token')
    admin_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                            'HS256'])['user_id']
    admin = User.query.filter_by(id=admin_id).first()
    if admin.role != 'admin':
        return jsonify({
            "error": "Unauthorized"
        })
    user_requesting = request.json.get('id')
    user = User.query.filter_by(id=user_requesting).first()
    user.role = 'owner'
    user.requested_owner_role = False
    db.session.commit()
    return jsonify({
        "success": "Owner role approved"
    })

@admin_bp.route('/deny_owner', methods=['POST'])
@cross_origin()
def deny_owner():
    token = request.json.get('token')
    admin_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                            'HS256'])['user_id']
    admin = User.query.filter_by(id=admin_id).first()
    if admin.role != 'admin':
        return jsonify({
            "error": "Unauthorized"
        })
    user_requesting = request.json.get('id')
    user = User.query.filter_by(id=user_requesting).first()
    user.requested_owner_role = False
    db.session.commit()
    return jsonify({
        "success": "Owner role denied"
    })

@admin_bp.route('/approve_product', methods=['POST'])
@cross_origin()
def approve_product():
    token = request.json.get('token')
    admin_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                            'HS256'])['user_id']
    admin = User.query.filter_by(id=admin_id).first()
    if admin.role != 'admin':
        return jsonify({
            "error": "Unauthorized"
        })
    product_id = request.json.get('id')
    product = Product.query.filter_by(id=product_id).first()
    product.is_approved = True
    db.session.commit()
    return jsonify({
        "success": "Product approved"
    })

@admin_bp.route('/deny_product', methods=['POST'])
@cross_origin()
def deny_product():
    token = request.json.get('token')
    admin_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                            'HS256'])['user_id']
    admin = User.query.filter_by(id=admin_id).first()
    if admin.role != 'admin':
        return jsonify({
            "error": "Unauthorized"
        })
    product_id = request.json.get('id')
    product = Product.query.filter_by(id=product_id).first()
    Picture.query.filter_by(product_id=product_id).delete()
    db.session.delete(product)
    db.session.commit()
    return jsonify({
        "success": "Product denied"
    })

@admin_bp.route('/owner_requests', methods=['POST'])
@cross_origin()
def get_owner_requests():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                            'HS256'])['user_id']
    user = User.query.filter_by(id=user_id).first()
    if user.role != 'admin':
        return jsonify({
            "error": "Unauthorized"
        })
    users = User.query.filter_by(requested_owner_role=True).all()
    users_list = []
    for user in users:
        users_list.append({
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "member_since": user.date_added
        })
    return jsonify({
        "users": users_list
    })

@admin_bp.route('/get_pending_products', methods=['POST'])
@cross_origin()
def get_pending_products():
    token = request.json.get('token')
    user_id = jwt.decode(token, app.config['SECRET_KEY'], algorithms=[
                            'HS256'])['user_id']
    user = User.query.filter_by(id=user_id).first()
    if user.role != 'admin':
        return jsonify({
            "error": "Unauthorized"
        })
    products = Product.query.filter_by(is_approved=False).all()
    products_list = []
    for product in products:
        pictures = []
        filename = product.pictures[0].filename
        #get the image data from picture table
        data = product.pictures[0].bytes_data
        # Encode the image as a base64 string
        ext = os.path.splitext(filename)[1][1:].lower()
        content_type = f"image/{ext}"
        base64_data = base64.b64encode(data).decode('utf-8')

        pictures.append({
            "filename": filename,
            "data": base64_data
        })
        products_list.append({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "owner": product.owner,
            "pictures": pictures
        })

    return jsonify({
        "products": products_list
    })