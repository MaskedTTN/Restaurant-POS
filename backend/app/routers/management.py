from fastapi import APIRouter, Body, HTTPException, Request
from fastapi.params import Depends
from sqlalchemy import Date, cast
from sqlalchemy.orm import Session

from app.auth.device_bearer import EitherBearer
from app.auth.auth_bearer import JWTBearer
from app.dependencies import get_current_user, get_db
from ..schema import CreateOrderSchema, UpdateOrderStatusSchema, AddOrderItemSchema
from app.models import User, Device, Location, OrganizationUser, Order, OrderItem

router = APIRouter(prefix="/management", tags=["management"])

#endpoint to see todays revenue
@router.get("/revenue/today", dependencies=[Depends(JWTBearer())])
async def get_todays_revenue(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    org_user = db.query(OrganizationUser).filter(
        OrganizationUser.user_id == current_user.id
    ).first()
    if not org_user:
        raise HTTPException(status_code=403, detail="User not authorized")

    from datetime import datetime, timedelta

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    orders = db.query(Order).filter(
        Order.location_id.in_(
            db.query(Location.id).filter(Location.organization_id == org_user.organization_id)
        ),
        cast(Order.created_at, Date) == today_start.date(),  # Compare dates only
        Order.status == "ready"
    ).all()
    
    #no total amount for orders so we need to sum up order items
    for order in orders:
        order.total_amount = sum(item.quantity * item.price for item in db.query(OrderItem).filter(OrderItem.order_id == order.id).all())


    total_revenue = sum(order.total_amount for order in orders)

    return {"date": today_start.date(), "total_revenue": total_revenue}