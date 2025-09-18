from fastapi import FastAPI
from pydantic import BaseModel
from ai_service import get_answer_from_data
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

# 1. Create the FastAPI app instance (only once)
app = FastAPI()

# 2. Add the CORS middleware right after creating the app
origins = [
    "http://localhost:3000",  # The address of our React frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Define the structure of a request to the /api/ask endpoint
class QuestionRequest(BaseModel):
    question: str
    district: str

# 4. Load the data
try:
    df = pd.read_csv('../data.csv')
    print("CSV data loaded successfully!")
except FileNotFoundError:
    print("Error: data.csv not found. Make sure it's in the AquaIntel root folder.")
    df = None

# 5. Define all your API endpoints
@app.get("/")
def read_root():
    return {"message": "Welcome to the AquaIntel AI API!"}

@app.post("/api/ask")
def ask_ai(request: QuestionRequest):
    if df is not None:
        district_data = df[df['District'].str.lower() == request.district.lower()]
        if district_data.empty:
            return {"type": "text", "data": f"Sorry, I don't have any data for the district: {request.district}"}
        
        user_question = request.question.lower()

        # Check if the user is asking for a map
        if "map" in user_question:
            map_data = district_data.to_dict(orient="records")
            return {"type": "map", "data": map_data}
        else:
            # If not a map, use the RAG logic to answer the question
            context_sentences = []
            for index, row in district_data.iterrows():
                sentence = (f"For the block '{row['Block']}' in the '{row['District']}' district, "
                            f"the category is '{row['Category']}'.")
                context_sentences.append(sentence)
            
            context = " ".join(context_sentences)
            answer = get_answer_from_data(question=request.question, context=context)
            return {"type": "text", "data": answer}

    return {"type": "text", "data": "Sorry, the data is not available."}