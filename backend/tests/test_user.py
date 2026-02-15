def test_user_signup_and_login(client):
    signup_payload = {
        "fullname": "Test User",
        "email": "testuser@example.com",
        "password": "password123"
    }

    # Signup
    r = client.post("/user/signup", json=signup_payload)
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data

    # Login with correct credentials
    login_payload = {"email": "testuser@example.com", "password": "password123"}
    r2 = client.post("/user/login", json=login_payload)
    assert r2.status_code == 200
    data2 = r2.json()
    assert "access_token" in data2

    # Login with wrong password
    bad_login = {"email": "testuser@example.com", "password": "wrongpass"}
    r3 = client.post("/user/login", json=bad_login)
    assert r3.status_code == 200
    assert r3.json().get("error") == "Wrong login details!"
