from functools import wraps
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import verify_token
from ..models.user import User

# JWT认证方案
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        username = verify_token(token)
        
        if username is None:
            raise credentials_exception
        
        # 从数据库获取用户信息
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise credentials_exception
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="用户账户已被禁用"
            )
        
        return user
        
    except Exception:
        raise credentials_exception


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户账户未激活"
        )
    return current_user


def require_permissions(required_permissions: list):
    """权限检查装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 这里可以根据需要实现权限检查逻辑
            # 暂时只检查用户是否为管理员
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="未认证的用户"
                )
            
            # 简单的权限检查：只有管理员用户名可以访问某些功能
            admin_usernames = ['admin', 'administrator', 'root']
            if current_user.username not in admin_usernames:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="权限不足"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def rate_limit(max_requests: int, window_seconds: int = 3600):
    """API限流装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 这里可以实现Redis基础的限流逻辑
            # 暂时只是一个占位符
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def validate_request_data(schema_class):
    """请求数据验证装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                # 获取请求数据
                request_data = kwargs.get('request_data')
                if request_data:
                    # 使用Pydantic模型验证数据
                    validated_data = schema_class(**request_data)
                    kwargs['validated_data'] = validated_data
                
                return await func(*args, **kwargs)
                
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"数据验证失败: {str(e)}"
                )
        return wrapper
    return decorator


def log_api_calls(log_level: str = "INFO"):
    """API调用日志装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            import logging
            import time
            import json
            
            start_time = time.time()
            
            # 记录API调用开始
            logger = logging.getLogger(__name__)
            logger.info(f"API调用开始: {func.__name__}")
            
            try:
                result = await func(*args, **kwargs)
                
                # 记录API调用成功
                duration = time.time() - start_time
                logger.info(f"API调用成功: {func.__name__}, 耗时: {duration:.2f}秒")
                
                return result
                
            except Exception as e:
                # 记录API调用失败
                duration = time.time() - start_time
                logger.error(f"API调用失败: {func.__name__}, 耗时: {duration:.2f}秒, 错误: {str(e)}")
                raise
                
        return wrapper
    return decorator


def cache_response(ttl_seconds: int = 300):
    """响应缓存装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 这里可以实现Redis基础的缓存逻辑
            # 暂时只是一个占位符
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def handle_exceptions():
    """异常处理装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
                
            except HTTPException:
                # FastAPI HTTP异常直接抛出
                raise
                
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"参数错误: {str(e)}"
                )
                
            except PermissionError as e:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"权限错误: {str(e)}"
                )
                
            except FileNotFoundError as e:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"资源未找到: {str(e)}"
                )
                
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"未处理的异常: {func.__name__}, 错误: {str(e)}")
                
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="服务器内部错误"
                )
                
        return wrapper
    return decorator


def require_account_access(account_id_param: str = "account_id"):
    """Instagram账号访问权限检查装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            account_id = kwargs.get(account_id_param)
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="未认证的用户"
                )
            
            if not account_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="缺少账号ID参数"
                )
            
            # 检查用户是否有权限访问该Instagram账号
            from ..models.instagram_account import InstagramAccount
            
            db = kwargs.get('db')
            if not db:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="数据库连接不可用"
                )
            
            account = db.query(InstagramAccount).filter(
                InstagramAccount.id == account_id,
                InstagramAccount.user_id == current_user.id
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="无权限访问该Instagram账号"
                )
            
            # 将账号信息添加到kwargs中
            kwargs['instagram_account'] = account
            
            return await func(*args, **kwargs)
            
        return wrapper
    return decorator
