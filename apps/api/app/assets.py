from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Asset, User
from app.schemas import AssetCreate, AssetResponse, AssetUpdate

router = APIRouter(prefix="/assets", tags=["IT management"])


@router.get("", response_model=list[AssetResponse])
def list_assets(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Asset]:
    return list(
        db.scalars(
            select(Asset)
            .where(Asset.owner_id == user.id)
            .order_by(Asset.id.desc())
        ).all()
    )


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    payload: AssetCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Asset:
    asset = Asset(
        owner_id=user.id,
        name=payload.name,
        asset_tag=payload.asset_tag.upper(),
        category=payload.category,
        assigned_to=payload.assigned_to,
        location=payload.location,
        status=payload.status,
        notes=payload.notes,
    )
    db.add(asset)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An asset with this tag already exists in your inventory.",
        ) from error
    db.refresh(asset)
    return asset


@router.patch("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    payload: AssetUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Asset:
    asset = db.scalar(
        select(Asset).where(Asset.id == asset_id, Asset.owner_id == user.id)
    )
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")

    changes = payload.model_dump(exclude_unset=True)
    if "asset_tag" in changes and changes["asset_tag"] is not None:
        changes["asset_tag"] = changes["asset_tag"].upper()
    for field, value in changes.items():
        setattr(asset, field, value)

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An asset with this tag already exists in your inventory.",
        ) from error
    db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    asset = db.scalar(
        select(Asset).where(Asset.id == asset_id, Asset.owner_id == user.id)
    )
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
    db.delete(asset)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
