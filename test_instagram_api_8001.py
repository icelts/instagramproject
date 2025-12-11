#!/usr/bin/env python3
"""
Instagram API测试脚本 - 端口8001
测试简化的后端服务
"""

import requests
import json
import time
from typing import Dict, Any

# API配置 - 使用端口8001
BASE_URL = "http://localhost:8001"

# 测试数据
SYSTEM_USER = {
    "username": "admin",
    "password": "admin123"
}

class SimpleAPITester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        
    def log(self, message: str, level: str = "INFO"):
        """打印日志"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                   headers: Dict = None) -> Dict:
        """发送HTTP请求"""
        url = f"{BASE_URL}{endpoint}"
        
        # 设置默认headers
        if headers is None:
            headers = {}
            
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
    
    def test_health_check(self) -> bool:
        """测试健康检查"""
        self.log("=" * 50)
        self.log("步骤1: 健康检查")
        
        result = self.make_request("GET", "/health")
        
        if result.get("status") == "healthy":
            self.log("健康检查成功!")
            self.log(f"消息: {result.get('message')}")
            return True
        else:
            self.log("健康检查失败!", "ERROR")
            return False
    
    def test_root_endpoint(self) -> bool:
        """测试根端点"""
        self.log("=" * 50)
        self.log("步骤2: 测试根端点")
        
        result = self.make_request("GET", "/")
        
        if "message" in result:
            self.log("根端点测试成功!")
            self.log(f"消息: {result.get('message')}")
            return True
        else:
            self.log("根端点测试失败!", "ERROR")
            return False
    
    def test_login(self) -> bool:
        """测试登录"""
        self.log("=" * 50)
        self.log("步骤3: 测试登录")
        
        result = self.make_request("POST", "/api/v1/auth/login", SYSTEM_USER)
        
        if "access_token" in result:
            self.token = result["access_token"]
            user_info = result.get("user", {})
            self.log("登录成功!")
            self.log(f"用户: {user_info.get('username')}")
            self.log(f"Token: {self.token[:20]}...")
            return True
        else:
            self.log("登录失败!", "ERROR")
            return False
    
    def run_full_test(self) -> bool:
        """运行完整测试流程"""
        self.log("开始简化版API测试流程")
        self.log("=" * 50)
        
        # 步骤1: 健康检查
        if not self.test_health_check():
            return False
        
        # 步骤2: 根端点测试
        if not self.test_root_endpoint():
            return False
        
        # 步骤3: 登录测试
        if not self.test_login():
            return False
        
        self.log("=" * 50)
        self.log("🎉 所有测试步骤完成!")
        self.log(f"✅ 健康检查成功")
        self.log(f"✅ 根端点测试成功")
        self.log(f"✅ 登录功能正常")
        
        return True


def main():
    """主函数"""
    print("Instagram API 简化测试脚本 - 端口8001")
    print("=" * 50)
    
    tester = SimpleAPITester()
    
    try:
        # 运行完整测试
        success = tester.run_full_test()
        
        if success:
            print("\n" + "=" * 50)
            print("测试完成! 简化版后端服务正常工作。")
            print("后端服务地址: http://localhost:8001")
        
    except KeyboardInterrupt:
        tester.log("测试被用户中断")
    except Exception as e:
        tester.log(f"测试过程中发生异常: {str(e)}", "ERROR")


if __name__ == "__main__":
    main()
