from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import event, func

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), unique=False, nullable=False)
    last_name = db.Column(db.String(80), unique=False, nullable=False)
    email = db.Column(db.String(80), unique=True, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=True)
    phone = db.Column(db.String(10), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), unique=False, nullable=False)
    last_password_reset = db.Column(db.DateTime, default = datetime.now())
    security_question = db.Column(db.String(80), unique=False, nullable=False)
    security_answer = db.Column(db.String(80), unique=False, nullable=False)
    date_added = db.Column(db.DateTime, default=datetime.now())
    role = db.Column(db.String(10), unique=False, nullable = False, default='user')
    requested_owner_role = db.Column(db.Boolean, nullable = False, default = False)

    @property
    def password(self):
        raise AttributeError('Password is not a readable attribute')
    
    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return '<Name %r %r>' % (self.firstName, self.lastName)
    

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable = False)
    description = db.Column(db.Text, nullable = False)
    category = db.Column(db.String(20), nullable = False)
    zipcode = db.Column(db.String(5), nullable = False)
    pictures = db.relationship('Picture', backref='product', lazy = True)
    price = db.Column(db.Float, nullable = False)
    duration = db.Column(db.String(15), nullable = False)
    is_approved = db.Column(db.Boolean, nullable = False, default = False)
    rating = db.Column(db.Integer, default = None)
    is_available = db.Column(db.Boolean, nullable = False, default = True)
    owner = db.Column(db.Integer, db.ForeignKey('user.id'), nullable = False)
    reviews = db.relationship('Review', backref='product', lazy=True)

    def set_rating(self, rating):
        self.rating = rating
        # calculate the average rating of all reviews for this product
        avg_rating = db.session.query(func.avg(Review.rating)).filter(Review.product_id == self.id).scalar()
        # update the rating column in the database with the calculated average rating
        self.rating = round(avg_rating) if avg_rating is not None else None
        db.session.commit()

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f'<Review {self.id}>'


class Picture(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(100), nullable = False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable = False)
    bytes_data = db.Column(db.LargeBinary, nullable = True)

class Promo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), nullable = False, unique = True)
    discount = db.Column(db.Float, nullable = False)
    is_active = db.Column(db.Boolean, nullable = False, default = True)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product = db.relationship('Product', backref='transactions')
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable = False)
    renter_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable = False)
    renter_address = db.Column(db.String(80), nullable = False)
    renter_zipcode = db.Column(db.String(5), nullable = False)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable = False)
    duration = db.Column(db.String(15), nullable = False)
    promo = db.Column(db.String(20), default = '')
    start_date = db.Column(db.DateTime, nullable = False)
    end_date = db.Column(db.DateTime, nullable = False)
    initial_payment = db.Column(db.Float, nullable = False)
    payments_remaining = db.Column(db.Integer, nullable = False, default = 0)
    balance_remaining = db.Column(db.Float, nullable = False, default = 0)
    is_active = db.Column(db.Boolean, nullable = False, default = True)
    is_cancelled = db.Column(db.Boolean, default = False)
    requested_refund = db.Column(db.Boolean, default = False)
    is_refunded = db.Column(db.Boolean, default = False)
    refund_reason = db.Column(db.String(200))
    amount_paid_to_date = db.Column(db.Float, default = initial_payment)
    payments_required = db.Column(db.Integer)
