from pydantic import BaseModel, Field, EmailStr


class PostSchema(BaseModel):
    id: int = Field(default=None)
    title: str = Field(...)
    content: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Securing FastAPI applications with JWT.",
                "content": "In this tutorial, you'll learn how to secure your application by enabling authentication using JWT. We'll be using PyJWT to sign, encode and decode JWT tokens...."
            }
        }

class UserSchema(BaseModel):
    fullname: str = Field(...)
    email: EmailStr = Field(...)
    password: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "fullname": "John Doe",
                "email": "admin@example.com",
                "password": "weakpassword"
            }
        }

class UserLoginSchema(BaseModel):
    email: EmailStr = Field(...)
    password: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@example.com",
                "password": "weakpassword"
            }
        }

class OrganizationSchema(BaseModel):
    name: str = Field(...)
    address: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Tech Corp",
                "address": "123 Tech Street, Silicon Valley, CA"
            }
        }

class OrganizationUserSchema(BaseModel):
    user_id: int = Field(...)
    organization_id: int = Field(...)
    role: str = Field(...)
    status: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": 1,
                "organization_id": 1,
                "role": "admin",
                "status": "active"
            }
        }

class LocationSchema(BaseModel):
    name: str = Field(...)
    address: str = Field(...)
    timezone: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Main Branch",
                "address": "456 Business Rd, Metropolis, NY",
                "timezone": "America/New_York"
            }
        }

class LicenseSchema(BaseModel):
    location_id: int = Field(...)
    license_key: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "location_id": 1,
                "license_key": "ABC123XYZ789"
            }
        }

class CreateDeviceSlotSchema(BaseModel):
    location_id: int = Field(...)
    device_name: str = Field(...)
    device_type: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "location_id": 1,
                "device_name": "POS Terminal 1",
                "device_type": "POS"
            }
        }

class PairDeviceSchema(BaseModel):
    pairing_code: str = Field(...)
    hardware_id: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "pairing_code": "ABCD1234",
                "hardware_id": "HWID-5678-XYZ"
            }
        }

class CreateProductSchema(BaseModel):
    location_id: int = Field(...)
    name: str = Field(...)
    description: str = Field(...)
    price: float = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "location_id": 1,
                "price": 2.99,
                "name": "Espresso",
                "description": "Just an Espresso"
                }
        }

class CreateOrderSchema(BaseModel):
    location_id: int = Field(...)
    items: list[dict] = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "location_id": 1,
                "items": [
                    {"product_id": 1, "quantity": 2},
                    {"product_id": 3, "quantity": 1}
                ]
            }
        }

class UpdateOrderStatusSchema(BaseModel):
    status: str = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "status": "preparing"
            }
        }

class AddOrderItemSchema(BaseModel):
    product_id: int = Field(...)
    quantity: int = Field(...)
    price: float = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 2,
                "quantity": 3,
                "price": 5.99
            }
        }
