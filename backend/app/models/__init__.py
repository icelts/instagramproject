"""
Aggregate imports for all SQLAlchemy models so that relationship string
references can be resolved when the mappers are configured.
"""

from .user import User
from .instagram_account import InstagramAccount
from .proxy import ProxyConfig
from .schedule import PostSchedule
from .message import MessageLog
from .auto_reply import AutoReplyRule
from .search_task import SearchTask
from .collected_user_data import CollectedUserData
from .instagram_account_stat import InstagramAccountStat

__all__ = [
    "User",
    "InstagramAccount",
    "InstagramAccountStat",
    "ProxyConfig",
    "PostSchedule",
    "MessageLog",
    "AutoReplyRule",
    "SearchTask",
    "CollectedUserData",
]
