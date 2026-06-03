import sqlite3

def check_db():
    conn = sqlite3.connect('sehatrecover.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Print tables
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in c.fetchall()]
    print("Tables:", tables)
    
    if 'partner_lab_rates' in tables:
        c.execute("SELECT * FROM partner_lab_rates")
        rows = [dict(r) for r in c.fetchall()]
        print("Partner lab rates count:", len(rows))
        for r in rows:
            print(f"- {r['labName']} / {r['testName']} ({r['id']}): Base={r['basePrice']} Custom={r['customPrice']} Params={r['parameters']}")
    else:
        print("No partner_lab_rates table found!")
    
    conn.close()

if __name__ == '__main__':
    check_db()
