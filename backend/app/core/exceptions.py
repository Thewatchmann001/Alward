"""
Custom exceptions for ALWARD backend
"""


class AlwardException(Exception):
    """Base exception for ALWARD application."""
    pass


class BlockchainError(AlwardException):
    """Exception raised for blockchain-related errors."""
    pass


class AIServiceError(AlwardException):
    """Exception raised for AI service errors."""
    pass


class ValidationError(AlwardException):
    """Exception raised for validation errors."""
    pass


class AuthenticationError(AlwardException):
    """Exception raised for authentication errors."""
    pass


class AuthorizationError(AlwardException):
    """Exception raised for authorization errors."""
    pass


class InvalidCredentials(AuthenticationError):
    """Exception raised for invalid credentials."""
    pass


class UserNotFound(AlwardException):
    """Exception raised when user is not found."""
    pass