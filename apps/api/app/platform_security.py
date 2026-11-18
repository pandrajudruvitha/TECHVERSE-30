import time
from collections import defaultdict, deque
from urllib.parse import urlparse

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send


RATE_LIMITS = {
    "/ai/chat": 20,
    "/auth/login": 30,
    "/auth/register": 30,
}
WINDOW_SECONDS = 60
MAX_REQUEST_BYTES = 64 * 1024


class PlatformSecurityMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app
        self.requests: dict[str, deque[float]] = defaultdict(deque)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        path = request.url.path

        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > MAX_REQUEST_BYTES:
                    response = JSONResponse(
                        status_code=413,
                        content={"detail": "Request body exceeds the 64 KB limit."},
                    )
                    await response(scope, receive, send)
                    return
            except ValueError:
                pass

        limit = RATE_LIMITS.get(path)
        if limit:
            client = request.client.host if request.client else "unknown"
            key = f"{client}:{path}"
            now = time.monotonic()
            timestamps = self.requests[key]
            while timestamps and now - timestamps[0] >= WINDOW_SECONDS:
                timestamps.popleft()
            if len(timestamps) >= limit:
                response = JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Try again in one minute."},
                    headers={"Retry-After": str(WINDOW_SECONDS)},
                )
                await response(scope, receive, send)
                return
            timestamps.append(now)

        async def send_with_security_headers(message: dict) -> None:
            if message["type"] == "http.response.start":
                headers = dict(message.get("headers", []))
                headers[b"x-content-type-options"] = b"nosniff"
                headers[b"x-frame-options"] = b"DENY"
                headers[b"referrer-policy"] = b"strict-origin-when-cross-origin"
                headers[b"permissions-policy"] = b"camera=(), microphone=(), geolocation=()"
                if request.url.scheme == "https":
                    headers[b"strict-transport-security"] = b"max-age=31536000; includeSubDomains"
                if path.startswith("/auth/") or path.startswith("/ai/") or path.startswith("/assets"):
                    headers[b"cache-control"] = b"no-store"
                message["headers"] = list(headers.items())
            await send(message)

        await self.app(scope, receive, send_with_security_headers)


def validate_provider_base_url(base_url: str) -> str:
    parsed = urlparse(base_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("LLM_BASE_URL must be an absolute HTTP or HTTPS URL.")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ValueError("LLM_BASE_URL must not contain credentials, query parameters, or fragments.")
    if parsed.scheme == "http" and parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
        raise ValueError("HTTP provider URLs are limited to local development hosts.")
    return base_url
