import sys
sys.path.insert(0, '.')
import sqlite3

def run():
    conn = sqlite3.connect('alward_demo.db')
    cursor = conn.cursor()
    
    queries = [
        "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;",
        "ALTER TABLE users ADD COLUMN locked_until DATETIME;",
        "ALTER TABLE milestones ADD COLUMN alward_approved BOOLEAN DEFAULT 0;",
        "ALTER TABLE investments ADD COLUMN startup_id INTEGER REFERENCES startups(id);",
        "ALTER TABLE investments ADD COLUMN tx_signature VARCHAR(88);",
        "ALTER TABLE investments ADD COLUMN investment_id VARCHAR(100);"
    ]
    
    for q in queries:
        try:
            cursor.execute(q)
            print(f"Success: {q}")
        except Exception as e:
            print(f"Failed: {q} - {e}")
            
    conn.commit()
    conn.close()

if __name__ == '__main__':
    run()
