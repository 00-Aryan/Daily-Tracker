from google import genai

client = genai.Client(api_key="AIzaSyAR7Z-8Tre5IzVaDc5uGYwqtTF6c1b3gUw")

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Hello"
)

print(response.text)