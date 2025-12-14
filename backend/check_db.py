import pymysql
import os

# 数据库连接配置
config = {
    'host': '125.212.244.39',
    'user': 'instagramproject',
    'password': 'SWaexZfEtwSTAfHp',
    'database': 'instagramproject',
    'port': 3306
}

try:
    # 连接数据库
    connection = pymysql.connect(**config)
    cursor = connection.cursor()
    
    # 检查users表结构
    print("=== Users表结构 ===")
    cursor.execute("DESCRIBE users")
    columns = cursor.fetchall()
    for column in columns:
        print(f"{column[0]}: {column[1]}")
    
    # 检查用户数据
    print("\n=== 用户数据 ===")
    cursor.execute("SELECT id, username, email, role, is_active FROM users")
    users = cursor.fetchall()
    for user in users:
        print(f"ID: {user[0]}, 用户名: {user[1]}, 邮箱: {user[2]}, 角色: {user[3]}, 激活: {user[4]}")
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f"数据库连接错误: {e}")
