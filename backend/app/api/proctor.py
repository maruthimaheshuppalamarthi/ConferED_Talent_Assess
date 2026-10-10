"""
Proctor API: the live proctoring event stream.

    WS /ws/proctoring?token=<access or candidate JWT>

  - Candidates publish events about themselves only (the candidate id is taken from the token).
  - Only Proctors receive the broadcast stream; other staff roles (including System Admin) are
    listen-only connections that receive nothing.
Proctor sign-in lives in app/api/staff_auth.py (mounted at /proctor/auth).
"""
from typing import List, Optional, Tuple

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.api.deps import authenticate_websocket
from app.core.roles import PORTAL_PROCTOR, can_access_portal
from app.db.session import SessionLocal

router = APIRouter(tags=["Proctor"])


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[Tuple[WebSocket, dict]] = []

    async def connect(self, websocket: WebSocket, principal: dict):
        await websocket.accept()
        self.active_connections.append((websocket, principal))

    def disconnect(self, websocket: WebSocket):
        self.active_connections = [(ws, p) for ws, p in self.active_connections if ws is not websocket]

    async def broadcast_to_monitors(self, message: dict):
        """Proctoring events go only to staff allowed into the Proctor portal."""
        for ws, principal in list(self.active_connections):
            if principal["kind"] == "staff" and can_access_portal(principal["role"], PORTAL_PROCTOR):
                try:
                    await ws.send_json(message)
                except Exception:
                    self.disconnect(ws)


manager = ConnectionManager()


@router.websocket("/ws/proctoring")
async def websocket_proctoring_endpoint(websocket: WebSocket, token: Optional[str] = Query(default=None)):
    db = SessionLocal()
    try:
        principal = authenticate_websocket(token, db)
    finally:
        db.close()

    if principal is None:
        await websocket.close(code=4401)  # unauthenticated
        return

    await manager.connect(websocket, principal)
    try:
        while True:
            data = await websocket.receive_json()
            if principal["kind"] != "candidate":
                continue  # staff connections are listen-only
            await manager.broadcast_to_monitors({
                "type": "PROCTORING_EVENT",
                "candidateId": principal["id"],  # never trust a client-supplied id
                "event": data.get("event"),
                "severity": data.get("severity", "medium"),
                "timestamp": data.get("timestamp"),
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass  # socket already closed by the peer
