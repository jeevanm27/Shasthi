from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Shasthi Insights Service", version="1.0.0")


class CartLine(BaseModel):
    category: str
    quantity: int = Field(ge=1)


class CartRequest(BaseModel):
    items: list[CartLine]


@app.get("/health")
def health():
    return {"status": "ok", "service": "insights-service"}


@app.post("/api/insights/cart")
def cart_insight(cart: CartRequest):
    categories = {item.category.lower() for item in cart.items}
    count = sum(item.quantity for item in cart.items)
    if "blends" in categories and "powders" not in categories:
        message = "Pair your blend with turmeric powder for an easy everyday masala kit."
    elif count >= 3:
        message = "Your pantry is well stocked — you qualify for free local delivery."
    else:
        message = "Add two more jars to build a balanced spice shelf."
    return {"message": message, "itemCount": count}
