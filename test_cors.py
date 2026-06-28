import asyncio
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.testclient import TestClient

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://allowed.com"],
)

class WidgetCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/widget/"):
            if request.method == "OPTIONS":
                print("WidgetCORSMiddleware caught OPTIONS")
                response = Response(status_code=204)
            else:
                print("WidgetCORSMiddleware passing request")
                response = await call_next(request)
            
            origin = request.headers.get("origin")
            response.headers["Access-Control-Allow-Origin"] = origin if origin else "*"
            return response
        return await call_next(request)

app.add_middleware(WidgetCORSMiddleware)

@app.get("/widget/hello")
def hello():
    return {"msg": "hello"}

def test():
    client = TestClient(app)
    print("Sending OPTIONS /widget/hello")
    res = client.options("/widget/hello", headers={"Origin": "https://disallowed.com", "Access-Control-Request-Method": "GET"})
    print("OPTIONS status:", res.status_code)
    print("OPTIONS headers:", res.headers)

    print("\nSending GET /widget/hello")
    res = client.get("/widget/hello", headers={"Origin": "https://disallowed.com"})
    print("GET status:", res.status_code)
    print("GET body:", res.text)
    print("GET headers:", res.headers)

if __name__ == "__main__":
    test()
