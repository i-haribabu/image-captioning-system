import os
import re
import time
import logging
import base64
from io import BytesIO
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration
from gtts import gTTS
from deep_translator import GoogleTranslator

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="static/build", static_url_path="/")
CORS(app)

# Load BLIP model
device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {device}")
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
model = BlipForConditionalGeneration.from_pretrained(
    "Salesforce/blip-image-captioning-large"
).to(device)

def clean_caption(caption):
    """Improves caption readability."""
    caption = caption.lower().strip()
    caption = re.sub(r'\b(\w+)\s+\1\b', r'\1', caption)  # Remove duplicate words
    return caption.capitalize()

@app.route("/generate_caption", methods=["POST"])
def handle_caption():
    try:
        start_time = time.time()
        logger.debug("Received request for /generate_caption")

        if "image" not in request.files:
            logger.error("No image provided in request")
            return jsonify({"error": "No image provided"}), 400

        image = request.files["image"]
        target_lang = request.form.get("language", "en")

        image_bytes = image.read()
        image_pil = Image.open(BytesIO(image_bytes)).convert("RGB")

        inputs = processor(images=image_pil, return_tensors="pt").to(device)
        output = model.generate(
            **inputs,
            max_length=50,
            repetition_penalty=1.5,
            num_beams=7,
            temperature=0.7
        )

        caption = processor.decode(output[0], skip_special_tokens=True)
        caption = clean_caption(caption)
        logger.debug(f"Generated caption: {caption}")

        if target_lang != "en":
            caption = GoogleTranslator(source="auto", target=target_lang).translate(caption)
            logger.debug(f"Translated caption to {target_lang}: {caption}")

        tts = gTTS(caption, lang=target_lang)
        audio_buffer = BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_base64 = base64.b64encode(audio_buffer.getvalue()).decode("utf-8")

        elapsed_time = time.time() - start_time
        logger.info(f"Caption generated in {elapsed_time:.2f} seconds")

        return jsonify({"caption": caption, "audio": audio_base64})

    except Exception as e:
        logger.error(f"Error in /generate_caption: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# Serve React Frontend
@app.route("/")
def serve():
    logger.debug("Serving index.html")
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def static_files(path):
    logger.debug(f"Serving static file: {path}")
    try:
        return send_from_directory(app.static_folder, path)
    except FileNotFoundError:
        logger.warning(f"File not found: {path}, serving index.html for React Router")
        return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    if not os.path.exists(app.static_folder):
        logger.error(f"Static folder {app.static_folder} does not exist")
    else:
        logger.info(f"Static folder set to {app.static_folder}")
    app.run(host="0.0.0.0", port=5000, debug=True)
