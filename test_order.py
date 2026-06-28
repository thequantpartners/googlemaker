import asyncio
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import PlainTextResponse

class MidA(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        print("MidA in")
        res = await call_next(request)
        print("MidA out")
        return res

class MidB(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        print("MidB in")
        res = await call_next(request)
        print("MidB out")
        return res

app = Starlette()
app.add_middleware(MidA)
app.add_middleware(MidB)

@app.route("/")
async def homepage(request):
    print("endpoint")
    return PlainTextResponse("ok")

async def test():
    from starlette.testclient import TestClient
    client = TestClient(app)
    client.get("/")

asyncio.run(test())
