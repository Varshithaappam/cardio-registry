import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="care_registry"
    )
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute("SHOW COLUMNS FROM patients")
    columns = [col[0] for col in cursor.fetchall()]
    print("Existing columns:", columns)
    
    if "address" not in columns:
        cursor.execute("ALTER TABLE patients ADD COLUMN address VARCHAR(500) DEFAULT NULL")
        print("Added address column")
        
    if "higher_education" not in columns:
        cursor.execute("ALTER TABLE patients ADD COLUMN higher_education ENUM('Primary','Secondary','Graduate','Post Graduate','None') DEFAULT NULL")
        print("Added higher_education column")
        
    if "occupation" not in columns:
        cursor.execute("ALTER TABLE patients ADD COLUMN occupation VARCHAR(255) DEFAULT NULL")
        print("Added occupation column")
        
    conn.commit()
    cursor.close()
    conn.close()
    print("Database schema migration verified successfully!")
except Exception as e:
    print("Database alteration notice:", e)
