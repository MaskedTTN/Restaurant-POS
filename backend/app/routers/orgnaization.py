from fastapi import APIRouter, Body, Request
from fastapi.params import Depends
from keystone import LicenseValidationError, LicenseValidator

from app.auth.auth_bearer import JWTBearer
from app.dependencies import get_current_user

from ..schema import LocationSchema, OrganizationSchema, OrganizationUserSchema
from ..database import get_db
from app.models import Location, Organization, OrganizationUser, User, License

from sqlalchemy.orm import Session

router = APIRouter(prefix="/organization", tags=["organization"])

@router.post("/create", dependencies=[Depends(JWTBearer())])
async def create_organization(request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), organization: OrganizationSchema = Body(...)):
    # debug: log incoming authorization header
    try:
        auth_header = request.headers.get('authorization')
        print(f"[debug] /organization/create Authorization: {auth_header}")
    except Exception:
        pass
    new_organization = Organization(
        name=organization.name
    )

    db.add(new_organization)
    db.commit()
    db.refresh(new_organization)

    new_organization_user = OrganizationUser(
        organization_id=new_organization.id,
        user_id=current_user.id,
        role="owner",
        status="active"
    )

    db.add(new_organization_user)
    db.commit()
    db.refresh(new_organization_user)

    return {"organization_id": new_organization.id, "name": new_organization.name}

@router.get("/my", dependencies=[Depends(JWTBearer())])
async def get_my_organizations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org_users = db.query(OrganizationUser).filter(OrganizationUser.user_id == current_user.id).all()
    organizations = []
    for org_user in org_users:
        organization = db.query(Organization).filter(Organization.id == org_user.organization_id).first()
        if organization:
            organizations.append({"organization_id": organization.id, "name": organization.name, "role": org_user.role, "status": org_user.status})
    return {"organizations": organizations}

@router.get("/{org_id}", dependencies=[Depends(JWTBearer())])
async def get_organization(org_id: int, db: Session = Depends(get_db)):
    organization = db.query(Organization).filter(Organization.id == org_id).first()
    if organization:
        return {"organization_id": organization.id, "name": organization.name, "created_at": organization.created_at}
    return {"error": "Organization not found"}

@router.post("/{org_id}/add_location", dependencies=[Depends(JWTBearer())])
async def add_location(org_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), location: LocationSchema = Body(...)):
    # Check if current user is part of the organization
    org_user = db.query(OrganizationUser).filter(OrganizationUser.organization_id == org_id, OrganizationUser.user_id == current_user.id).first()
    if not org_user:
        return {"error": "You are not a member of this organization"}

    new_location = Location(
        organization_id=org_id,
        name=location.name,
        address=location.address,
        timezone=location.timezone
    )

    db.add(new_location)
    db.commit()
    db.refresh(new_location)

    return {"location_id": new_location.id, "name": new_location.name}

@router.get("/{org_id}/locations", dependencies=[Depends(JWTBearer())])
async def get_organization_locations(org_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if current user is part of the organization
    org_user = db.query(OrganizationUser).filter(OrganizationUser.organization_id == org_id, OrganizationUser.user_id == current_user.id).first()
    if not org_user:
        return {"error": "You are not a member of this organization"}

    locations = db.query(Location).filter(Location.organization_id == org_id).all()
    location_list = []
    for location in locations:
        location_list.append({"location_id": location.id, "name": location.name, "address": location.address, "timezone": location.timezone})

    return {"locations": location_list}

@router.post("/{org_id}/{location_id}", dependencies=[Depends(JWTBearer())])
async def set_location_license(org_id: int, location_id: int, license_key: str = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if current user is part of the organization
    org_user = db.query(OrganizationUser).filter(OrganizationUser.organization_id == org_id, OrganizationUser.user_id == current_user.id).first()
    if not org_user:
        return {"error": "You are not a member of this organization"}

    location = db.query(Location).filter(Location.id == location_id, Location.organization_id == org_id).first()
    if not location:
        return {"error": "Location not found in this organization"}

    validator = LicenseValidator()
    try:
        info = validator.get_license_info(license_key)
        
        if not info:
            print(f"License key '{license_key}' not found")
            return
        
    except LicenseValidationError as e:
        print(f"Error: {e}")
    if not info.is_valid or info.is_expired:
        return {"error": "Invalid or expired license key"}
    #check license validity and features and seats here
    new_license = License(
        location_id=location.id,
        license_key=license_key)
    db.add(new_license)
    db.commit()
    db.refresh(location)

    return {"location_id": location.id, "name": location.name, "license_info": info}

