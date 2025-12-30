from fastapi import APIRouter, Body, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.device_bearer import EitherBearer
from app.dependencies import get_db
from ..schema import CreateOrderSchema, UpdateOrderStatusSchema, AddOrderItemSchema
from app.models import User, Device, Location, OrganizationUser, Order, OrderItem

router = APIRouter(prefix="/displays", tags=["displays"])

@router.get("/orders", dependencies=[Depends(EitherBearer)])
async def get_kitchen_orders(db: Session = Depends(get_db), auth=Depends(EitherBearer)):
    if auth["type"] == "user":
        current_user: User = auth["data"]
        
        org_user = db.query(OrganizationUser).filter(
            OrganizationUser.user_id == current_user.id
        ).first()
        if not org_user:
            raise HTTPException(status_code=403, detail="User not authorized")

        orders = db.query(Order).filter(Order.location_id.in_(
            db.query(Location.id).filter(Location.organization_id == org_user.organization_id)
        )).all()

        order_list = [{"id": order.id, "location_id": order.location_id, "status": order.status} for order in orders]

        return {"kitchen_orders": order_list}
    if auth["type"] == "device":
        device: Device = auth["data"]
        
            
        location = db.query(Location).filter(Location.id == device.location_id).first()
        if not location:
            raise HTTPException(status_code=403, detail="Device not associated with a valid location")
        if device.device_type == "KitchenDisplay":
            orders = db.query(Order).filter(
                (Order.location_id == location.id) & (Order.status == "preparing")
            ).all()
        elif device.device_type == "CustomerDisplay":
            orders = db.query(Order).filter(
                (Order.location_id == location.id) & (Order.status != "open")
            ).all()
        else:
            raise HTTPException(status_code=403, detail="Device type not allowed")
        order_list = [{"id": order.id, "location_id": order.location_id, "status": order.status} for order in orders]

        return {"kitchen_orders": order_list}
    else:
        raise HTTPException(status_code=401, detail="Not authenticated as user")

# endpoint for devices to move order to 'ready' status
@router.put("/orders/{order_id}/ready", dependencies=[Depends(EitherBearer)])
async def mark_order_ready(order_id: int, db: Session = Depends(get_db), auth=Depends(EitherBearer)):
    if auth["type"] != "device":
        raise HTTPException(status_code=403, detail="Only devices can mark orders as ready")

    device: Device = auth["data"]
    if device.device_type != "KitchenDisplay":
        raise HTTPException(status_code=403, detail="Device type not allowed")
    location = db.query(Location).filter(Location.id == device.location_id).first()
    if not location:
        raise HTTPException(status_code=403, detail="Device not associated with a valid location")

    order = db.query(Order).filter(
        (Order.id == order_id) & (Order.location_id == location.id)
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for this location")

    order.status = "ready"
    db.commit()
    db.refresh(order)

    return {"message": "Order marked as ready", "order": {"id": order.id, "status": order.status}}