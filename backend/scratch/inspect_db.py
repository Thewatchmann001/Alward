import sys
sys.path.insert(0, '.')
from app.db.session import engine
from sqlalchemy import inspect

insp = inspect(engine)
print('=== TABLES ===')
for tbl in sorted(insp.get_table_names()):
    print(f'--- {tbl} ---')
    for col in insp.get_columns(tbl):
        nn = '' if col['nullable'] else ' NOT NULL'
        print(f"  {col['name']} ({col['type']}){nn}")
