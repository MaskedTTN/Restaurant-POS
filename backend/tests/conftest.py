import os
import tempfile
import shutil

# Set required environment variables before importing app modules
os.environ.setdefault("db_url", "sqlite:///./test_db.db")
os.environ.setdefault("secret", "testsecret")
os.environ.setdefault("algorithm", "HS256")

from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import importlib

from app.api import app
from app.database import Base, get_db

importlib.import_module("app.models")  # ensure models are imported so Base.metadata is populated


def _create_temp_db():
    tmpdir = tempfile.mkdtemp(prefix="test_db_")
    db_path = os.path.join(tmpdir, "test_db.sqlite")
    url = f"sqlite:///{db_path}"
    engine = create_engine(url, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    return tmpdir, engine, TestingSessionLocal


def override_get_db_factory(TestingSessionLocal):
    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    return _override_get_db


@pytest.fixture(scope="module")
def client(request):
    # create temp DB and override dependency
    tmpdir, engine, TestingSessionLocal = _create_temp_db()
    app.dependency_overrides[get_db] = override_get_db_factory(TestingSessionLocal)

    # finalizer to guarantee teardown even if tests fail
    def _teardown():
        try:
            engine.dispose()
        finally:
            try:
                shutil.rmtree(tmpdir)
            except Exception:
                pass

    request.addfinalizer(_teardown)

    with TestClient(app) as c:
        yield c
