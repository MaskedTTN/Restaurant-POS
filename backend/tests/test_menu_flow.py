def test_menu_create_and_get(client):
    # signup and create org + location
    signup = {"fullname": "Menu User", "email": "menu@example.com", "password": "pass1234"}
    r = client.post("/user/signup", json=signup)
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_payload = {"name": "MenuOrg", "address": "1 Menu St"}
    r2 = client.post("/organization/create", json=org_payload, headers=headers)
    org_id = r2.json()["organization_id"]

    location_payload = {"name": "MenuLoc", "address": "1 Menu St", "timezone": "UTC"}
    r3 = client.post(f"/organization/{org_id}/add_location", json=location_payload, headers=headers)
    location_id = r3.json()["location_id"]

    # create a product
    product_payload = {"location_id": location_id, "name": "Coffee", "description": "Hot drink", "price": 3.5}
    r4 = client.post("/menu/", json=product_payload, headers=headers)
    assert r4.status_code == 200
    assert r4.json().get("message") == "Menu product created"

    # get menu
    r5 = client.get(f"/menu/{location_id}", headers=headers)
    assert r5.status_code == 200
    menu = r5.json()
    assert isinstance(menu.get("menu"), list)
    assert any(item["name"] == "Coffee" for item in menu.get("menu"))