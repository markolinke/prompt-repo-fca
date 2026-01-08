from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError


class JWTService:
    """Service for JWT token operations: encoding, decoding, and validation."""
    
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        """
        Initialize JWT service.
        
        Args:
            secret_key: Secret key for signing tokens
            algorithm: JWT algorithm (default: HS256)
        """
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    def encode_token(
        self,
        user_id: str,
        email: str,
        expires_in: timedelta
    ) -> str:
        """
        Encode an access token with user information.
        
        Args:
            user_id: User identifier
            email: User email
            expires_in: Token expiration time
            
        Returns:
            Encoded JWT token string
        """
        payload = {
            "sub": user_id,
            "email": email,
            "type": "access",
            "exp": datetime.now(timezone.utc) + expires_in,
            "iat": datetime.now(timezone.utc)
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def encode_refresh_token(
        self,
        user_id: str,
        expires_in: timedelta
    ) -> str:
        """
        Encode a refresh token.
        
        Args:
            user_id: User identifier
            expires_in: Token expiration time
            
        Returns:
            Encoded JWT refresh token string
        """
        payload = {
            "sub": user_id,
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + expires_in,
            "iat": datetime.now(timezone.utc)
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def decode_token(self, token: str) -> dict | None:
        """
        Decode a JWT token without validation.
        
        Args:
            token: JWT token string
            
        Returns:
            Token payload dictionary or None if decoding fails
        """
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                options={"verify_exp": False}  # Don't verify expiration here
            )
            return payload
        except JWTError:
            return None
    
    def validate_token(self, token: str) -> dict | None:
        """
        Validate and decode a JWT token (includes expiration check).
        
        Args:
            token: JWT token string
            
        Returns:
            Token payload dictionary or None if token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm]
            )
            return payload
        except JWTError:
            return None

