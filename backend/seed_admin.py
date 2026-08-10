from app import create_app, db
from app.models import User, ROLE_ADMIN, STATUS_ACTIVE

app = create_app()

with app.app_context():
    db.create_all()
    admin = User.query.filter_by(role=ROLE_ADMIN).first()
    if admin:
        print(f"Admin account already exists:")
        print(f"Email: {admin.email}")
    else:
        admin = User(
            name="System Admin",
            email="admin@example.com",
            role=ROLE_ADMIN,
            status=STATUS_ACTIVE
        )
        admin.set_password("AdminPassword123")
        db.session.add(admin)
        db.session.commit()
        print("Admin account created successfully!")
        print("Email: admin@example.com")
        print("Password: AdminPassword123")
