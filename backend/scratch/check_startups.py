import sqlite3
import os

db_path = "c:/Users/user/ALWARD/backend/alward_demo.db"

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id, name, sector, funding_goal FROM startups")
        startups = cursor.fetchall()
        
        if not startups:
            print("The startups table is currently empty.")
        else:
            print(f"Found {len(startups)} startups:")
            for s in startups:
                print(f"ID: {s[0]} | Name: {s[1]} | Sector: {s[2]} | Goal: {s[3]} USDC")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
