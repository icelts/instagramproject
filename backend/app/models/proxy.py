from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class ProxyType(enum.Enum):
    """代理类型枚举"""
    HTTP = "http"
    HTTPS = "https"
    SOCKS4 = "socks4"
    SOCKS5 = "socks5"


proxy_type_enum = Enum(
    ProxyType,
    name="proxytype",
    values_callable=lambda enum_cls: [member.value for member in enum_cls],
)


class ProxyConfig(Base):
    """代理配置表"""
    __tablename__ = "proxy_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    name = Column(String(100), nullable=False, comment="代理名称")
    host = Column(String(255), nullable=False, comment="代理主机")
    port = Column(Integer, nullable=False, comment="代理端口")
    username = Column(String(100), nullable=True, comment="代理用户名")
    password_encrypted = Column(String(255), nullable=True, comment="加密密码")
    proxy_type = Column(proxy_type_enum, default=ProxyType.HTTP, nullable=False, comment="代理类型")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", back_populates="proxy_configs")
    instagram_accounts = relationship("InstagramAccount", back_populates="proxy")

    def __repr__(self):
        return f"<ProxyConfig(id={self.id}, name='{self.name}', type='{self.proxy_type.value}')>"

    def to_dict(self):
        """转换为字典"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "host": self.host,
            "port": self.port,
            "username": self.username,
            "proxy_type": self.proxy_type.value,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def get_proxy_url(self):
        """获取代理URL（不包含密码）"""
        if self.username:
            return f"{self.proxy_type.value}://{self.username}@{self.host}:{self.port}"
        else:
            return f"{self.proxy_type.value}://{self.host}:{self.port}"

    def get_proxy_url_with_auth(self, password):
        """获取包含认证信息的代理URL"""
        if self.username and password:
            return f"{self.proxy_type.value}://{self.username}:{password}@{self.host}:{self.port}"
        else:
            return f"{self.proxy_type.value}://{self.host}:{self.port}"

    @property
    def password_decrypted(self):
        """兼容旧逻辑的解密占位，当前直接返回存储值"""
        return self.password_encrypted
