from datetime import datetime
from .database import Base
from sqlalchemy import Column, Integer, LargeBinary, String, Text, ForeignKey, Enum

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    fullname = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(LargeBinary, nullable=False)

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=False, index=True, nullable=False)
    created_at = Column(String, default=datetime.utcnow)

class OrganizationUser(Base):
    __tablename__ = "organization_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    role = Column(Enum("owner", "admin", "manager", "staff", name="user_roles"), default="member")
    status = Column(Enum("active", "disabled", "invited", name="user_statuses"), default="active")

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    name = Column(String, nullable=False)
    address = Column(Text, nullable=True)
    timezone = Column(String, default="UTC")

class License(Base):
    __tablename__ = "licenses"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    license_key = Column(String, unique=True, nullable=False)

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    device_name = Column(String, nullable=False)
    device_status = Column(Enum("paired", "unpaired", "decommissioned", name="device_statuses"), default="unpaired")
    device_type = Column(Enum("POS", "KitchenDisplay", "CustomerDisplay", name="device_type"), default="POS")
    pairing_code = Column(String, unique=True, nullable=False)
    hardware_id = Column(String, unique=True)
    device_token = Column(String, unique=True)
    registered_at = Column(String, default=datetime.utcnow)
    last_active_at = Column(String, default=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    Location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Integer, nullable=False)

class StockItem(Base):
    __tablename__ = "stock_items"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=0)
    last_updated = Column(String, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    status = Column(Enum("open", "preparing", "ready", "paid", name="order_statuses"), default="pending")
    created_at = Column(String, default=datetime.utcnow)

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    price = Column(Integer, nullable=False)