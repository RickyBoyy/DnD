from dotenv import load_dotenv
import os
import groq 
from langchain_groq import ChatGroq

load_dotenv()

class LanguageModel:
    def __init__(self, model_id="llama-3.3-70b-versatile"):
        # Initialize the language model with the specified ID
        self.model_id = model_id
        self.client = ChatGroq(model=model_id)  

    def generate_response(self, prompt):
        # Send the prompt to the model and get the response
        try:
            response = self.client.invoke(prompt)
            return response.content  # Adjust based on Groq response structure
        except Exception as e:
            print(f"Error generating response: {e}")
            return None
