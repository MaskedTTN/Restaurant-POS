from fastapi import APIRouter, Body
from fastapi.params import Depends
from keystone import LicenseValidationError, LicenseValidator

from app.auth.auth_bearer import JWTBearer
from app.dependencies import get_current_user

from ..schema import LocationSchema, OrganizationSchema, OrganizationUserSchema, CreateProductSchema
from ..database import get_db
from app.models import Location, Organization, OrganizationUser, Product, User, License

from sqlalchemy.orm import Session

router = APIRouter(prefix="/menu", tags=["menu"])

#CRUD operations for menu will go here

@router.post("/", dependencies=[Depends(JWTBearer())])
async def create_menu_product(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), product_data: CreateProductSchema = Body(...)):
    # Implementation for creating a menu product
    location = db.query(Location).filter(Location.id == product_data.location_id).first()
    if not location:
        return {"error": "Location not found"}

    org_user = db.query(OrganizationUser).filter(OrganizationUser.organization_id == location.organization_id, OrganizationUser.user_id == current_user.id).first()
    if not org_user:
        return {"error": "User not authorized for this location"}

    new_product = Product(
        Location_id=location.id,
        name=product_data.name,
        description=product_data.description,
        price=product_data.price
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {"message": "Menu product created", "product_data": new_product}


@router.get("/{location_id}", dependencies=[Depends(JWTBearer())])
async def get_menu(location_id:int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Implementation for retrieving menu products for a location
    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        return {"error": "Location not found"}

    org_user = db.query(OrganizationUser).filter(OrganizationUser.organization_id == location.organization_id, OrganizationUser.user_id == current_user.id).first()
    if not org_user:
        return {"error": "User not authorized for this location"}

    products = db.query(Product).filter(Product.Location_id == location.id).all()
    product_list = [{"id": product.id, "name": product.name, "description": product.description, "price": product.price} for product in products]

    return {"menu": product_list}

@router.put("/{product_id}", dependencies=[Depends(JWTBearer())])
async def update_menu_product(product_id:int, db: Session = Depends(get_db), current_user = Depends(get_current_user), product_data: CreateProductSchema = Body(...)):
    # Implementation for updating a menu product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Product not found"}

    location = db.query(Location).filter(Location.id == product.Location_id).first()
    org_user = db.query(OrganizationUser).filter(OrganizationUser.organization_id == location.organization_id, OrganizationUser.user_id == current_user.id).first()
    if not org_user:
        return {"error": "User not authorized to update this product"}

    product.name = product_data.name
    product.description = product_data.description
    product.price = product_data.price

    db.commit()
    db.refresh(product)

    return {"message": "Menu product updated", "product_data": product}

@router.delete("/{product_id}", dependencies=[Depends(JWTBearer())])
async def delete_menu_product(product_id:int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Implementation for deleting a menu product
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Product not found"}

    location = db.query(Location).filter(Location.id == product.Location_id).first()
    org_user = db.query(OrganizationUser).filter(OrganizationUser.organization_id == location.organization_id, OrganizationUser.user_id == current_user.id).first()
    if not org_user:
        return {"error": "User not authorized to delete this product"}

    db.delete(product)
    db.commit()

    return {"message": "Menu product deleted"}