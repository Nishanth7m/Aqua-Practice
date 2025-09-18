from transformers import pipeline

# Load a pre-trained question-answering pipeline from Hugging Face
# This model is lightweight and great for our proof of concept.
qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

def get_answer_from_data(question: str, context: str):
    """
    Takes a user's question and a string of context (our data),
    and returns an answer found within the context.
    """
    result = qa_pipeline(question=question, context=context)

    # We add a confidence check. If the model is not sure, we say so.
    if result['score'] < 0.3: # You can adjust this threshold
        return "I am not sure I can answer that based on the data."

    return result['answer']