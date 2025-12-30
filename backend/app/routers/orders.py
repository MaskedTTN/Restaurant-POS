from fastapi import APIRouter, Body, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.device_bearer import EitherBearer
from app.dependencies import get_db
from ..schema import CreateOrderSchema, UpdateOrderStatusSchema, AddOrderItemSchema
from app.models import User, Device, Location, OrganizationUser, Order, OrderItem

router = APIRouter(prefix="/orders", tags=["orders"])



""" JWT_SECRET = config("secret")
JWT_ALGORITHM = config("algorithm")

async def EitherBearer(request: Request, db: Session = Depends(get_db)):
    # JWT first
    try:
        print("Trying JWTBearer")
        token: str = await JWTBearer()(request)
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("user_id")  # adjust depending on your JWT payload
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid JWT payload")
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return {"type": "user", "data": user}

    except HTTPException:
        pass

    # Device
    try:
        print("Trying DeviceBearer")
        device: Device = await DeviceBearer()(request)
        if device.device_type != "POS":
            raise HTTPException(status_code=403, detail="Device type not allowed")
        return {"type": "device", "data": device}
    except HTTPException:
        pass

    raise HTTPException(status_code=401, detail="Not authenticated") """


@router.post("/")
async def create_order(
    auth=Depends(EitherBearer),
    db: Session = Depends(get_db),
    order_data: CreateOrderSchema = Body(...)
):
    if auth["type"] == "user":
        
        current_user: User = auth["data"]

        location = db.query(Location).filter(Location.id == order_data.location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")

        org_user = db.query(OrganizationUser).filter(
            OrganizationUser.organization_id == location.organization_id,
            OrganizationUser.user_id == current_user.id
        ).first()
        if not org_user:
            raise HTTPException(status_code=403, detail="User not authorized for this location")
    elif auth["type"] == "device":
        device: Device = auth["data"]
        if device.device_type != "POS":
            raise HTTPException(status_code=403, detail="Device type not allowed")
        location = db.query(Location).filter(Location.id == order_data.location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        if device.location_id != location.id:
            raise HTTPException(status_code=403, detail="Device not authorized for this location")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    new_order = Order(location_id=order_data.location_id, status="open")
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return {"message": "Order created", "order_id": new_order.id}


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    auth=Depends(EitherBearer),
    db: Session = Depends(get_db)
):
    if auth["type"] == "user":
        current_user: User = auth["data"]
        org_user = db.query(OrganizationUser).filter(
            OrganizationUser.organization_id == current_user.organization_id,
            OrganizationUser.user_id == current_user.id
        ).first()
        if not org_user:
            raise HTTPException(status_code=403, detail="User not authorized")

        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        return {"order": {"id": order.id, "location_id": order.location_id, "status": order.status}}

    elif auth["type"] == "device":
        device: Device = auth["data"]
        if device.device_type != "POS":
            raise HTTPException(status_code=403, detail="Device type not allowed")
        order = db.query(Order).filter(Order.id == order_id, Order.location_id == device.location_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found or device not allowed")

        return {"order": {"id": order.id, "location_id": order.location_id, "status": order.status}}


@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_data: UpdateOrderStatusSchema = Body(...),
    auth=Depends(EitherBearer),
    db: Session = Depends(get_db)
):
    if auth["type"] != "user":
        raise HTTPException(status_code=403, detail="Device cannot update orders")
    current_user: User = auth["data"]

    org_user = db.query(OrganizationUser).filter(
        OrganizationUser.organization_id == current_user.organization_id,
        OrganizationUser.user_id == current_user.id
    ).first()
    if not org_user:
        raise HTTPException(status_code=403, detail="User not authorized")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status_data.status
    db.commit()
    db.refresh(order)
    return {"message": "Order status updated", "order": {"id": order.id, "status": order.status}}


@router.post("/{order_id}/items")
async def add_order_item(
    order_id: int,
    item_data: AddOrderItemSchema = Body(...),
    auth=Depends(EitherBearer),
    db: Session = Depends(get_db)
):
    if auth["type"] == "user":
        current_user: User = auth["data"]

        org_user = db.query(OrganizationUser).filter(
            OrganizationUser.organization_id == current_user.organization_id,
            OrganizationUser.user_id == current_user.id
        ).first()
        if not org_user:
            raise HTTPException(status_code=403, detail="User not authorized")

        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
    elif auth["type"] == "device":
        device: Device = auth["data"]
        if device.device_type != "POS":
            raise HTTPException(status_code=403, detail="Device type not allowed")
        order = db.query(Order).filter(Order.id == order_id, Order.location_id == device.location_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found or device not allowed")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_order_item = OrderItem(
        order_id=order.id,
        product_id=item_data.product_id,
        quantity=item_data.quantity,
        price=item_data.price
    )
    db.add(new_order_item)
    db.commit()
    db.refresh(new_order_item)
    return {"message": "Order item added", "order_id": order.id}


@router.get("/{order_id}/items")
async def get_order_items(
    order_id: int,
    auth=Depends(EitherBearer),
    db: Session = Depends(get_db)
):
    if auth["type"] == "user":
        current_user: User = auth["data"]
        org_user = db.query(OrganizationUser).filter(
            OrganizationUser.organization_id == current_user.organization_id,
            OrganizationUser.user_id == current_user.id
        ).first()
        if not org_user:
            raise HTTPException(status_code=403, detail="User not authorized")

        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

    elif auth["type"] == "device":
        device: Device = auth["data"]
        if device.device_type != "POS":
            raise HTTPException(status_code=403, detail="Device type not allowed")
        order = db.query(Order).filter(Order.id == order_id, Order.location_id == device.location_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found or device not allowed")

    order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    items_list = [{"id": item.id, "product_id": item.product_id, "quantity": item.quantity} for item in order_items]
    return {"order_id": order.id, "items": items_list}
