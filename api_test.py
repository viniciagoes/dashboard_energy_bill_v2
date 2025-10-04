from google import genai
from google.genai import types
import pathlib
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()
api_key = os.getenv("API_KEY")

client = genai.Client(api_key=api_key)

# Retrieve and encode the PDF byte
filepath = pathlib.Path('pdf_test.pdf')

prompt = "Me retorne em formato de JSON quem é o cliente dessa conta e qual é o endereço dele"
response = client.models.generate_content(
  model="gemini-2.5-flash",
  contents=[
      types.Part.from_bytes(
        data=filepath.read_bytes(),
        mime_type='application/pdf',
      ),
      prompt])
print(response.text)
