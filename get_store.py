import urllib.request
import json
import sys

api_key = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiI2ODQzNjBhNzk4ZjdiOTMxYTBjMjMyNGEzYjk2NTk2YjhhZjQwMDUxYTY4NmYwZjI5YTdjNzA3YTY4Y2Y5MTM1Y2FiOWJkZDA5ODg5MWI2ZSIsImlhdCI6MTc4MTg1MTk0MS4zNjU1NzIsIm5iZiI6MTc4MTg1MTk0MS4zNjU1NzQsImV4cCI6NDk1NDM0ODgwMC4wMjQwNDIsInN1YiI6Ijc0MjIwNDgiLCJzY29wZXMiOltdfQ.5GjZicJ6nm4v7PGo5zXKdY9eUg4wHMhmJixfGkE8t7wGH1uv6vpbSAZZnDRONF5uYeyNTAe7MtDV2QHy8kl16t1BpLJbB-u-eV-hOCPFRsB_y4EdBgYn9cvfCDNmblB1GQzIMRm8Q5MOf4aEQZ23AQp_4vSYbWeRNeFaMWyRcwes-tWe6SGLMpyumXPadx1vALjVyxgaSsp45DQGHUHCbCzwSlSDKLE4GSZDPY478Gz-v2hLKKHOrR95bEdji6pTaeFT2Qi2jrqWXteu0tD88khg5TnFsAzf36wdnFPBuXcwifLN81oTNz4Ykkfb-qI-7gCFdRtG4aJ0wQF6Vi12er5s8KfAsVnSdWues-0o9pSAMHbXxEsJ80In1wbI-uVBLvgAAdPAv5efIgy4hMV-RFJrz6g7zUNhcsRQgRQOz1ah0aAUTwTyxHVzI2UlUaUc2cjj4jIlzeN9moZValtzOCUqHcIyjD050I7m6uIBbyrsCBmW6XfDW7nd6oXvnl7OtbjlPbJy5mypkwphZ1PxPhuy1llzYJpvHnrBl4WTybCH6ejsvLFaInvZjlpVS-0to1GbEpxs7VKeek85Dd5x3RnK5swhmYSiVxMkQzjv3Zgmszb7nLv2xCEk0sUm9nnnaRmeC6zLzRZigkftrFL7coiTa9iQhCyPEK3l-_234c4"

url = "https://api.lemonsqueezy.com/v1/stores"
req = urllib.request.Request(url, headers={
    "Authorization": f"Bearer {api_key}",
    "Accept": "application/vnd.api+json"
})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        stores = data.get("data", [])
        for store in stores:
            print(f"Store ID: {store['id']} - Name: {store['attributes']['name']}")
except Exception as e:
    print(f"Error: {e}")
