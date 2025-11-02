import os
import shutil
import tempfile
from fastapi.testclient import TestClient


# Configure test environment before importing app
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-secret"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
os.environ["UPLOAD_DIR"] = "test_uploads"

from backend import database  # noqa: E402
from backend.main import app  # noqa: E402


client = TestClient(app)


def setup_module(module):
    # Fresh DB and uploads directory
    if os.path.exists("test.db"):
        os.remove("test.db")
    if os.path.exists("test_uploads"):
        shutil.rmtree("test_uploads")
    database.Base.metadata.create_all(bind=database.engine)


def auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def register_user(email: str, password: str, full_name: str, role: str):
    payload = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "role": role,
        "bio": None,
        "skills": [],
        "portfolio_url": None,
    }
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 200, r.text
    return r.json()


def login(email: str, password: str) -> str:
    # OAuth2 form-encoded
    r = client.post(
        "/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_register_login_me():
    user = register_user("emp@example.com", "pass123", "Employer One", "employer")
    token = login("emp@example.com", "pass123")
    r = client.get("/users/me", headers=auth_headers(token))
    assert r.status_code == 200
    me = r.json()
    assert me["email"] == "emp@example.com"
    assert me["role"] == "employer"


def test_project_and_proposal_flow_and_files_and_stats():
    # Register executor
    register_user("exec@example.com", "pass123", "Executor One", "executor")

    # Employer login and create project
    emp_token = login("emp@example.com", "pass123")
    proj_payload = {
        "title": "Test Project",
        "description": "A project for testing",
        "budget": 1000.0,
        "requirements": "",
    }
    r = client.post("/projects", json=proj_payload, headers=auth_headers(emp_token))
    assert r.status_code == 200, r.text
    project = r.json()

    # Executor login and create proposal
    exec_token = login("exec@example.com", "pass123")
    prop_payload = {
        "project_id": project["id"],
        "proposed_price": 900.0,
        "proposed_timeline": "2 weeks",
        "cover_letter": "I can do it",
    }
    r = client.post("/proposals", json=prop_payload, headers=auth_headers(exec_token))
    assert r.status_code == 200, r.text
    proposal = r.json()
    assert proposal["status"] == "pending"

    # Employer views proposals
    r = client.get(f"/projects/{project['id']}/proposals", headers=auth_headers(emp_token))
    assert r.status_code == 200
    proposals = r.json()
    assert len(proposals) == 1

    # Employer accepts proposal
    r = client.put(f"/proposals/{proposal['id']}", json={"status": "accepted"}, headers=auth_headers(emp_token))
    assert r.status_code == 200, r.text
    accepted = r.json()
    assert accepted["status"] == "accepted"

    # Project should now have executor and be in_progress
    r = client.get(f"/projects/{project['id']}", headers=auth_headers(emp_token))
    assert r.status_code == 200
    proj_after = r.json()
    assert proj_after["executor_id"] is not None
    assert proj_after["status"] == "in_progress"

    # Assigned executor uploads a file
    with tempfile.NamedTemporaryFile(delete=False) as tf:
        tf.write(b"hello test file")
        tf.flush()
        tf.seek(0)
        with open(tf.name, "rb") as f:
            files = {"file": ("test.txt", f, "text/plain")}
            r = client.post(
                f"/projects/{project['id']}/files",
                files=files,
                data={"is_final_delivery": "false"},
                headers=auth_headers(exec_token),
            )
            assert r.status_code == 200, r.text
            uploaded = r.json()
            assert uploaded["filename"] == "test.txt"

    # List files as employer
    r = client.get(f"/projects/{project['id']}/files", headers=auth_headers(emp_token))
    assert r.status_code == 200
    files_list = r.json()
    assert len(files_list) >= 1

    # Dashboard stats for employer and executor
    r = client.get("/dashboard/stats", headers=auth_headers(emp_token))
    assert r.status_code == 200
    stats_emp = r.json()
    assert stats_emp["projects_count"] >= 1

    r = client.get("/dashboard/stats", headers=auth_headers(exec_token))
    assert r.status_code == 200
    stats_exec = r.json()
    assert stats_exec["proposals_count"] >= 1

