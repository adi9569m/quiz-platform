import json
from app.models import User, ROLE_STUDENT, ROLE_ADMIN, STATUS_ACTIVE, STATUS_INACTIVE


def _get_token(client, email, password):
    res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    return res.get_json()["access_token"]


# 1. Admin can access dashboard statistics
def test_admin_access_dashboard_stats(client, admin_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/dashboard/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "total_students" in data
    assert data["total_students"] >= 0
    assert data["total_quizzes"] == 0
    assert data["published_quizzes"] == 0
    assert data["draft_quizzes"] == 0
    assert data["total_questions"] == 0
    assert data["total_attempts"] == 0
    assert data["average_score"] == 0
    assert data["passed_attempts"] == 0
    assert data["failed_attempts"] == 0


# 2. Student cannot access dashboard statistics (403)
def test_student_cannot_access_dashboard_stats(client, student_user):
    token = _get_token(client, student_user["email"], student_user["password"])
    res = client.get(
        "/api/admin/dashboard/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


# 3. Unauthenticated user cannot access dashboard statistics (401)
def test_unauthenticated_cannot_access_dashboard_stats(client):
    res = client.get("/api/admin/dashboard/stats")
    assert res.status_code == 401


# 4. Admin can list students
def test_admin_can_list_students(client, admin_user, student_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1
    # Check fields returned
    student_record = next(u for u in data if u["email"] == student_user["email"])
    assert student_record["role"] == ROLE_STUDENT
    assert "password" not in student_record
    assert "password_hash" not in student_record


# 5. Student cannot list students through admin endpoint (403)
def test_student_cannot_list_students_via_admin(client, student_user):
    token = _get_token(client, student_user["email"], student_user["password"])
    res = client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 403


# 6. Admin can search students by name or email
def test_admin_search_students(client, admin_user, student_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    # Search by partial email
    res = client.get(
        "/api/admin/users?search=student@",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) >= 1
    assert any(u["email"] == student_user["email"] for u in data)

    # Search non-matching term
    res_empty = client.get(
        "/api/admin/users?search=nonexistentusersearchquery",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_empty.status_code == 200
    assert len(res_empty.get_json()) == 0


# 7. Admin can view a student profile by ID
def test_admin_view_student_profile(client, admin_user, student_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        f"/api/admin/users/{student_user['id']}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "user" in data
    user_info = data["user"]
    assert user_info["id"] == student_user["id"]
    assert user_info["email"] == student_user["email"]
    assert "password" not in user_info


# 8. Admin can deactivate a student
def test_admin_deactivate_student(client, admin_user, student_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.patch(
        f"/api/admin/users/{student_user['id']}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": STATUS_INACTIVE}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["status"] == STATUS_INACTIVE


# 9. Admin can activate a student
def test_admin_activate_student(client, admin_user, student_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    # First deactivate
    client.patch(
        f"/api/admin/users/{student_user['id']}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": STATUS_INACTIVE}
    )
    # Then activate
    res = client.patch(
        f"/api/admin/users/{student_user['id']}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": STATUS_ACTIVE}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["status"] == STATUS_ACTIVE


# 10. Admin can delete a student where appropriate
def test_admin_delete_student(client, admin_user, app):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    # Create a temporary student to delete
    with app.app_context():
        temp_user = User(
            name="Temp Student",
            email="tempstudent@example.com",
            role=ROLE_STUDENT,
            status=STATUS_ACTIVE
        )
        temp_user.set_password("TempPass123")
        from app.extensions import db
        db.session.add(temp_user)
        db.session.commit()
        temp_id = temp_user.id

    res = client.delete(
        f"/api/admin/users/{temp_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    assert "deleted successfully" in res.get_json()["message"]

    # Verify student no longer exists
    get_res = client.get(
        f"/api/admin/users/{temp_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_res.status_code == 404


# 11. Password/hash is never returned
def test_password_hash_never_returned(client, admin_user, student_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])

    # Check list users
    res_list = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    raw_list = res_list.get_data(as_text=True)
    assert "password" not in raw_list.lower()

    # Check view user
    res_view = client.get(f"/api/admin/users/{student_user['id']}", headers={"Authorization": f"Bearer {token}"})
    raw_view = res_view.get_data(as_text=True)
    assert "password" not in raw_view.lower()


# 12. Invalid user ID returns 404
def test_invalid_user_id_returns_404(client, admin_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.get(
        "/api/admin/users/99999",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 404

    patch_res = client.patch(
        "/api/admin/users/99999/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": STATUS_ACTIVE}
    )
    assert patch_res.status_code == 404

    del_res = client.delete(
        "/api/admin/users/99999",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert del_res.status_code == 404


# 13. Invalid status is rejected (400)
def test_invalid_status_rejected(client, admin_user, student_user):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    res = client.patch(
        f"/api/admin/users/{student_user['id']}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "SUPERADMIN"}
    )
    assert res.status_code == 400
    data = res.get_json()
    assert "invalid status" in data["message"].lower()


# Test preventing admin deletion / modification via student user endpoint
def test_admin_cannot_delete_or_modify_other_admin_via_student_endpoint(client, admin_user, app):
    token = _get_token(client, admin_user["email"], admin_user["password"])
    # Attempt to target admin_user's ID on /api/admin/users/<admin_id>
    admin_id = admin_user["id"]

    res_get = client.get(f"/api/admin/users/{admin_id}", headers={"Authorization": f"Bearer {token}"})
    assert res_get.status_code == 404

    res_patch = client.patch(
        f"/api/admin/users/{admin_id}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": STATUS_INACTIVE}
    )
    assert res_patch.status_code == 404

    res_del = client.delete(f"/api/admin/users/{admin_id}", headers={"Authorization": f"Bearer {token}"})
    assert res_del.status_code == 404
