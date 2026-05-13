import sqlite3
import os

db_path = 'alward_demo.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables:", [t[0] for t in tables])

    if ('proposals',) in tables:
        cursor.execute("SELECT * FROM proposals;")
        proposals = cursor.fetchall()
        print("\nProposals:")
        for p in proposals:
            print(p)
    else:
        print("\n'proposals' table not found.")

except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
