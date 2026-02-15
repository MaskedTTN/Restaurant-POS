def test_create_organization_flow(client):
    # signup user
    signup = {"fullname": "Org User", "email": "org@example.com", "password": "pass1234"}
    r = client.post("/user/signup", json=signup)
    assert r.status_code == 200
    token = r.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # create organization
    org_payload = {"name": "My Org", "address": "123 Road"}
    r2 = client.post("/organization/create", json=org_payload, headers=headers)
    assert r2.status_code == 200
    data = r2.json()
    assert "organization_id" in data

    org_id = data["organization_id"]

    # add a location
    location_payload = {"name": "Main", "address": "123 Road", "timezone": "UTC"}
    r3 = client.post(f"/organization/{org_id}/add_location", json=location_payload, headers=headers)
    assert r3.status_code == 200
    loc = r3.json()
    assert "location_id" in loc
