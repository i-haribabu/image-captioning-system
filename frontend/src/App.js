import React, { useState } from "react";
import { motion } from "framer-motion";
import "./App.css";
import { Button, Typography, CircularProgress, MenuItem, Select } from "@mui/material";
import { CloudUpload, PlayArrow } from "@mui/icons-material";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setCaption("");
    setAudio(null);
  };

  const handleGenerateCaption = async () => {
    if (!selectedFile) {
      alert("Please select an image first.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("language", language);
    try {
      const response = await fetch("/generate_caption", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.caption) {
        setCaption(data.caption);
        setAudio(data.audio);
      } else {
        alert("Failed to generate caption. Try again!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error generating caption. Check the server.");
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (audio) {
      const audioElement = new Audio(`data:audio/mp3;base64,${audio}`);
      audioElement.play();
    }
  };

  return (
    <div className="container">
      <motion.h1
        className="animated-title"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0, color: "white" }} // Changed to white to match your CSS
        transition={{ duration: 1, ease: "easeOut" }}
      >
        Image Captioning
      </motion.h1>

      <motion.div whileHover={{ scale: 1.1 }}>
        <Button
          variant="contained"
          component="label"
          className="threeD-button"
          startIcon={<CloudUpload />}
        >
          Choose Image
          <input type="file" hidden onChange={handleFileChange} />
        </Button>
      </motion.div>

      {selectedFile && (
        <>
          <motion.div className="image-preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.img
              src={URL.createObjectURL(selectedFile)}
              alt="Selected"
              className="selected-image"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1 }}
            />
          </motion.div>

          <motion.div
            className="language-container"
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select"
              size="small"
              style={{ minWidth: "100px", height: "30px", fontSize: "12px" }}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="te">Telugu</MenuItem>
              <MenuItem value="hi">Hindi</MenuItem>
              <MenuItem value="zh-cn">Mandarin Chinese</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="ar">Arabic</MenuItem>
              <MenuItem value="bn">Bengali</MenuItem>
              <MenuItem value="pt">Portuguese</MenuItem>
              <MenuItem value="ru">Russian</MenuItem>
            </Select>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }}>
            <Button
              variant="contained"
              className="threeD-button"
              startIcon={<PlayArrow />}
              onClick={handleGenerateCaption}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Generate Caption"}
            </Button>
          </motion.div>
        </>
      )}

      {caption && (
        <motion.div className="caption-result" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
          <Typography variant="h6">Caption: {caption}</Typography>
          <motion.div whileHover={{ scale: 1.1 }}>
            <Button variant="contained" className="threeD-button" onClick={playAudio}>
              🔊 Play Audio
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default App;