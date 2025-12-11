#!/usr/bin/env python3
"""
Instagram API测试脚本
测试完整的登录、添加代理、添加账号和登录流程
"""

import requests
import json
import time
from typing import Dict, Any

# API配置
BASE_URL = "http://localhost:8000/api/v1"

# 测试数据
SYSTEM_USER = {
    "username": "admin",
    "password": "admin123"
}

PROXY_DATA = {
    "name": "Test Proxy",
    "host": "171.237.232.236",
    "port": 22057,
    "username": "user34dppb",
    "password": "passu36fbg",
    "proxy_type": "https"
}

INSTAGRAM_ACCOUNT = {
    "username": "ruth87283",
    "password": "r?Vcc7#NH1",
    "two_factor_secret": "SGPOGESJNAA6TV4PEQGVJCAN6KTPJ24R"
}

class InstagramAPITester:
    def __init__(self):
        self.token = None
        self.proxy_id = None
        self.account_id = None
        self.session = requests.Session()
        
    def log(self, message: str, level: str = "INFO"):
        """打印日志"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                   headers: Dict = None, expect_token: bool = True) -> Dict:
        """发送HTTP请求"""
        url = f"{BASE_URL}{endpoint}"
        
        # 设置默认headers
        if headers is None:
            headers = {}
        
        if expect_token and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
            
        if data and method.upper() in ["POST", "PUT", "PATCH"]:
            headers["Content-Type"] = "application/json"
            
        try:
            self.log(f"请求: {method.upper()} {url}")
            if data:
                # 隐藏敏感信息
                safe_data = self._sanitize_data(data)
                self.log(f"数据: {json.dumps(safe_data, indent=2, ensure_ascii=False)}")
                
            response = self.session.request(method, url, json=data, headers=headers)
            
            self.log(f"响应状态: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"响应数据: {json.dumps(result, indent=2, ensure_ascii=False)}")
                return result
            else:
                error_text = response.text
                self.log(f"请求失败: {error_text}", "ERROR")
                return {"error": error_text, "status_code": response.status_code}
                
        except Exception as e:
            self.log(f"请求异常: {str(e)}", "ERROR")
            return {"error": str(e)}
    
    def _sanitize_data(self, data: Dict) -> Dict:
        """隐藏敏感信息用于日志显示"""
        if not isinstance(data, dict):
            return data
            
        safe_data = data.copy()
        sensitive_fields = ["password", "two_factor_secret", "token"]
        
        for field in sensitive_fields:
            if field in safe_data:
                safe_data[field] = "***HIDDEN***"
                
        return safe_data
    
    def login_user(self) -> bool:
        """用户登录"""
        self.log("=" * 50)
        self.log("步骤1: 用户登录")
        
        result = self.make_request("POST", "/auth/login", SYSTEM_USER, expect_token=False)
        
        if "access_token" in result:
            self.token = result["access_token"]
            user_info = result.get("user", {})
            self.log(f"登录成功! 用户: {user_info.get('username')}")
            self.log(f"Token获取成功: {self.token[:20]}...")
            return True
        else:
            self.log("登录失败!", "ERROR")
            return False
    
    def test_proxy_before_add(self) -> bool:
        """测试代理连接（添加前）"""
        self.log("=" * 50)
        self.log("步骤2: 测试代理连接")
        
        # 创建代理测试请求数据
        proxy_test_data = {
            "host": PROXY_DATA["host"],
            "port": PROXY_DATA["port"],
            "username": PROXY_DATA["username"],
            "password": PROXY_DATA["password"],
            "proxy_type": PROXY_DATA["proxy_type"],
            "test_url": "https://www.instagram.com"
        }
        
        result = self.make_request("POST", "/instagram/proxies/test", proxy_test_data)
        
        if result.get("success"):
            self.log("代理测试成功!")
            self.log(f"状态码: {result.get('status_code')}")
            return True
        else:
            self.log("代理测试失败!", "ERROR")
            return False
    
    def add_proxy(self) -> bool:
        """添加代理配置"""
        self.log("=" * 50)
        self.log("步骤3: 添加代理配置")
        
        result = self.make_request("POST", "/instagram/proxies", PROXY_DATA)
        
        if "id" in result:
            self.proxy_id = result["id"]
            self.log(f"代理添加成功! 代理ID: {self.proxy_id}")
            self.log(f"代理名称: {result.get('name')}")
            self.log(f"代理地址: {result.get('host')}:{result.get('port')}")
            return True
        else:
            self.log("代理添加失败!", "ERROR")
            return False
    
    def add_instagram_account(self) -> bool:
        """添加Instagram账号"""
        self.log("=" * 50)
        self.log("步骤4: 添加Instagram账号")
        
        # 添加代理ID到账号数据
        account_data = INSTAGRAM_ACCOUNT.copy()
        account_data["proxy_id"] = self.proxy_id
        
        result = self.make_request("POST", "/instagram/accounts", account_data)
        
        if "id" in result:
            self.account_id = result["id"]
            self.log(f"Instagram账号添加成功! 账号ID: {self.account_id}")
            self.log(f"用户名: {result.get('username')}")
            self.log(f"登录状态: {result.get('login_status')}")
            self.log(f"关联代理ID: {result.get('proxy_id')}")
            return True
        else:
            self.log("Instagram账号添加失败!", "ERROR")
            return False
    
    def login_instagram_account(self) -> bool:
        """登录Instagram账号"""
        self.log("=" * 50)
        self.log("步骤5: 登录Instagram账号")
        
        if not self.account_id:
            self.log("没有找到Instagram账号ID!", "ERROR")
            return False
        
        result = self.make_request("POST", f"/instagram/accounts/{self.account_id}/login")
        
        if result.get("status") and result["status"].get("logged_in"):
            status = result["status"]
            self.log("Instagram账号登录成功!")
            self.log(f"Instagram用户名: {status.get('username')}")
            self.log(f"全名: {status.get('full_name')}")
            self.log(f"粉丝数: {status.get('followers')}")
            self.log(f"关注数: {status.get('following')}")
            return True
        else:
            self.log("Instagram账号登录失败!", "ERROR")
            self.log(f"错误信息: {result}")
            return False
    
    def check_account_status(self) -> bool:
        """检查账号状态"""
        self.log("=" * 50)
        self.log("步骤6: 检查账号状态")
        
        if not self.account_id:
            self.log("没有找到Instagram账号ID!", "ERROR")
            return False
        
        result = self.make_request("GET", f"/instagram/accounts/{self.account_id}/status")
        
        if result.get("logged_in"):
            self.log("账号状态检查成功!")
            self.log(f"登录状态: {result.get('status')}")
            self.log(f"用户名: {result.get('username')}")
            self.log(f"粉丝数: {result.get('followers')}")
            self.log(f"关注数: {result.get('following')}")
            return True
        else:
            self.log("账号状态检查失败或账号未登录!", "ERROR")
            return False
    
    def get_accounts_list(self) -> bool:
        """获取账号列表"""
        self.log("=" * 50)
        self.log("步骤7: 获取账号列表")
        
        result = self.make_request("GET", "/instagram/accounts")
        
        if isinstance(result, list):
            self.log(f"获取到 {len(result)} 个Instagram账号:")
            for i, account in enumerate(result, 1):
                self.log(f"  {i}. {account.get('username')} (ID: {account.get('id')}) - {account.get('login_status')}")
            return True
        else:
            self.log("获取账号列表失败!", "ERROR")
            return False
    
    def get_proxies_list(self) -> bool:
        """获取代理列表"""
        self.log("=" * 50)
        self.log("步骤8: 获取代理列表")
        
        result = self.make_request("GET", "/instagram/proxies")
        
        if isinstance(result, list):
            self.log(f"获取到 {len(result)} 个代理配置:")
            for i, proxy in enumerate(result, 1):
                self.log(f"  {i}. {proxy.get('name')} ({proxy.get('host')}:{proxy.get('port')}) - {proxy.get('proxy_type')}")
            return True
        else:
            self.log("获取代理列表失败!", "ERROR")
            return False
    
    def run_full_test(self) -> bool:
        """运行完整测试流程"""
        self.log("开始Instagram API完整测试流程")
        self.log("=" * 50)
        
        # 步骤1: 用户登录
        if not self.login_user():
            return False
        
        # 步骤2: 测试代理连接
        if not self.test_proxy_before_add():
            self.log("代理测试失败，但继续添加代理...", "WARNING")
        
        # 步骤3: 添加代理
        if not self.add_proxy():
            return False
        
        # 步骤4: 添加Instagram账号
        if not self.add_instagram_account():
            return False
        
        # 步骤5: 登录Instagram账号
        if not self.login_instagram_account():
            return False
        
        # 步骤6: 检查账号状态
        if not self.check_account_status():
            return False
        
        # 步骤7: 获取账号列表
        if not self.get_accounts_list():
            return False
        
        # 步骤8: 获取代理列表
        if not self.get_proxies_list():
            return False
        
        self.log("=" * 50)
        self.log("🎉 所有测试步骤完成!")
        self.log(f"✅ 系统用户登录成功")
        self.log(f"✅ 代理配置成功 (ID: {self.proxy_id})")
        self.log(f"✅ Instagram账号添加成功 (ID: {self.account_id})")
        self.log(f"✅ Instagram账号登录成功")
        self.log(f"✅ 账号状态检查正常")
        
        return True
    
    def cleanup(self):
        """清理测试数据"""
        self.log("=" * 50)
        self.log("清理测试数据...")
        
        if self.account_id:
            result = self.make_request("DELETE", f"/instagram/accounts/{self.account_id}")
            if "message" in result:
                self.log("Instagram账号删除成功")
        
        if self.proxy_id:
            result = self.make_request("DELETE", f"/instagram/proxies/{self.proxy_id}")
            if "message" in result:
                self.log("代理配置删除成功")
        
        self.log("清理完成")


def main():
    """主函数"""
    print("Instagram API 测试脚本")
    print("=" * 50)
    
    tester = InstagramAPITester()
    
    try:
        # 检查后端服务是否可用
        tester.log("检查后端服务可用性...")
        response = tester.session.get(f"{BASE_URL.replace('/api/v1', '')}/health", timeout=5)
        if response.status_code != 200:
            tester.log("后端服务不可用!", "ERROR")
            print("请确保后端服务正在运行: http://localhost:8000")
            return
        
        tester.log("后端服务可用")
        
        # 运行完整测试
        success = tester.run_full_test()
        
        if success:
            print("\n" + "=" * 50)
            print("测试完成! 所有功能正常工作。")
            print("是否要清理测试数据? (y/n): ", end="")
            
            try:
                choice = input().lower().strip()
                if choice == 'y':
                    tester.cleanup()
                else:
                    tester.log("保留测试数据")
            except KeyboardInterrupt:
                tester.log("用户取消操作")
        
    except KeyboardInterrupt:
        tester.log("测试被用户中断")
    except Exception as e:
        tester.log(f"测试过程中发生异常: {str(e)}", "ERROR")


if __name__ == "__main__":
    main()
