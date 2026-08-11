import sys
from app import create_app, db
from app.models import User, ROLE_ADMIN, STATUS_ACTIVE

app = create_app()

def create_new_admin(email, password, name="Admin User"):
    with app.app_context():
        db.create_all()
        email_clean = email.strip().lower()
        existing = User.query.filter_by(email=email_clean).first()
        
        if existing:
            existing.role = ROLE_ADMIN
            existing.status = STATUS_ACTIVE
            existing.set_password(password)
            if name:
                existing.name = name
            db.session.commit()
            print(f"[SUCCESS] Existing user '{email_clean}' has been updated to ADMIN role with the new password.")
        else:
            admin = User(
                name=name,
                email=email_clean,
                role=ROLE_ADMIN,
                status=STATUS_ACTIVE
            )
            admin.set_password(password)
            db.session.add(admin)
            db.session.commit()
            print(f"[SUCCESS] New ADMIN user created successfully!")
            print(f"   Name:     {name}")
            print(f"   Email:    {email_clean}")
            print(f"   Password: {password}")

if __name__ == "__main__":
    if len(sys.argv) >= 3:
        email_input = sys.argv[1]
        pass_input = sys.argv[2]
        name_input = sys.argv[3] if len(sys.argv) >= 4 else "Admin User"
        create_new_admin(email_input, pass_input, name_input)
    else:
        print("=== Create New Admin Account ===")
        email_input = input("Enter Admin Email: ").strip()
        pass_input = input("Enter Admin Password: ").strip()
        name_input = input("Enter Admin Name (Optional, default 'System Admin'): ").strip() or "System Admin"
        
        if not email_input or not pass_input:
            print("[ERROR] Email and password are required.")
            sys.exit(1)
            
        create_new_admin(email_input, pass_input, name_input)
