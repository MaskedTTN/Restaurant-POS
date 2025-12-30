from fastapi import APIRouter, Body
from fastapi.params import Depends
from keystone import LicenseValidationError, LicenseValidator

from app.auth.auth_bearer import JWTBearer
from app.dependencies import get_current_user

from ..schema import CreateDeviceSlotSchema, PairDeviceSchema
from ..database import get_db
from app.models import Location, Device, OrganizationUser, User, License

from sqlalchemy.orm import Session

import secrets


router = APIRouter(prefix="/devices", tags=["devices"])

PAIRING_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

def generate_pairing_code(length: int = 8) -> str:
    return ''.join(secrets.choice(PAIRING_CHARS) for _ in range(length))

def generate_device_token() -> str:
    return "dev_" + secrets.token_urlsafe(32)

@router.post("/register", dependencies=[Depends(JWTBearer())])
async def register_device(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), device_data: CreateDeviceSlotSchema = Body(...)):
    # Check if current user is part of the organization that owns the location
    location = db.query(Location).filter(Location.id == device_data.location_id).first()
    if not location:
        return {"error": "Location not found"}

    org_user = db.query(OrganizationUser).filter(OrganizationUser.organization_id == location.organization_id, OrganizationUser.user_id == current_user.id).first()
    if not org_user:
        return {"error": "User not authorized for this location"}

    # Validate license key to have specific device quota
    license = db.query(License).filter(License.location_id == location.organization_id).first()
    if not license:
        return {"error": "No license found for organization"}
    try:
        validator = LicenseValidator()
        info = validator.get_license_info(license.license_key)
        if not info:
            return {"error": "Invalid license"}
        license_info = info.features #{'customer_screen': False, 'kitchen_display': False, 'pos_terminal': True}
        print("License info:", license_info)
        if device_data.device_type == "POS" and not license_info.get('pos_terminal', False):
            return {"error": "License does not allow POS terminals"}
        if device_data.device_type == "KitchenDisplay" and not license_info.get('kitchen_display', False):
            return {"error": "License does not allow Kitchen Displays"}
        if device_data.device_type == "CustomerDisplay" and not license_info.get('customer_screen', False):
            return {"error": "License does not allow Customer Displays"}
    except LicenseValidationError as e:
        return {"error": f"License validation error: {str(e)}"}
    #create device slot

    

    new_device = Device(
        location_id=location.id,
        device_name=device_data.device_name,
        device_status="unpaired",
        device_type=device_data.device_type,
        pairing_code=generate_pairing_code()
    )
    
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    
    return {"device_id": new_device.id, "device_name": new_device.device_name, "pairing_code": new_device.pairing_code}

@router.post("/pair", tags=["devices"])
async def pair_device(db: Session = Depends(get_db), pair_data: PairDeviceSchema = Body(...)):
    device = db.query(Device).filter(Device.pairing_code == pair_data.pairing_code).first()
    if not device:
        return {"error": "Invalid pairing code"}

    if device.device_status != "unpaired":
        return {"error": "Device already paired or decommissioned"}

    # Pair the device
    device.device_status = "paired"
    device.hardware_id = pair_data.hardware_id
    device.device_token = generate_device_token()  # Implement token generation

    db.commit()
    db.refresh(device)

    return {"device_id": device.id, "device_name": device.device_name, "device_token": device.device_token}

@router.get("/", dependencies=[Depends(JWTBearer())])
async def list_devices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get all devices for locations that the user has access to
    org_user = db.query(OrganizationUser).filter(
        OrganizationUser.user_id == current_user.id
    ).first()
    if not org_user:
        return {"error": "User not authorized"}

    devices = db.query(Device).filter(
        Device.location_id.in_(
            db.query(Location.id).filter(Location.organization_id == org_user.organization_id)
        )
    ).all()

    device_list = []
    for device in devices:
        device_list.append({
            "device_id": device.id,
            "device_name": device.device_name,
            "device_status": device.device_status,
            "device_type": device.device_type,
            "location_id": device.location_id,
            "registered_at": device.registered_at,
            "last_active_at": device.last_active_at
        })

    return {"devices": device_list}