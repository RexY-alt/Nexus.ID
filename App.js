import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [translation, setTranslation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  // const recordedChunksRef = useRef([]); // Tidak diperlukan lagi jika hanya mengirim frame kunci

  // Fungsi untuk memulai akses kamera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      console.error("Gagal mengakses kamera:", err);
      alert("Pastikan Anda mengizinkan akses kamera.");
    }
  };

  // Fungsi untuk memulai perekaman (sebenarnya hanya untuk indikator visual)
  const startRecording = () => {
    if (stream) {
      // Kita tidak akan merekam seluruh video, hanya mengambil frame saat tombol stop ditekan.
      // mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
      // mediaRecorderRef.current.ondataavailable = (event) => { /* ... */ };
      // mediaRecorderRef.current.onstop = async () => { /* ... */ };
      // mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranslation('Merekam... Lakukan isyarat Anda.');
      console.log("Merekam dimulai...");
    }
  };

  // Fungsi untuk menghentikan "perekaman" dan mengirimkan FRAME kunci
  const stopRecording = () => {
    if (stream && videoRef.current) {
      setIsRecording(false);
      console.log("Mengambil frame kunci dan mengirim ke server...");
      setTranslation('Menganalisis isyarat...');

      const videoElement = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Ubah canvas menjadi Data URL (gambar Base64 - JPEG)
      const imageDataURL = canvas.toDataURL('image/jpeg'); 

      axios.post('http://localhost:5000/api/translate-sign', {
        image: imageDataURL // Mengirim gambar Base64 sebagai 'image'
      })
      .then(response => {
        setTranslation(response.data.text);
      })
      .catch(error => {
        console.error("Gagal menerjemahkan isyarat:", error);
        setTranslation(`Terjadi kesalahan: ${error.response?.data?.text || error.message}`);
      });
    } else {
      setTranslation("Tidak ada stream video untuk analisis.");
    }
  };

  useEffect(() => {
    startCamera(); // Akses kamera saat komponen dimuat
    return () => {
      // Membersihkan stream saat komponen tidak lagi digunakan
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="App">
      <h1>Penerjemah Isyarat BISINDO</h1>
      <div className="video-container">
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxWidth: '600px', transform: 'scaleX(-1)' }}></video>
      </div>
      <div className="controls">
        {!isRecording ? (
          <button onClick={startRecording}>Mulai Isyarat</button>
        ) : (
          <button onClick={stopRecording}>Selesai Isyarat</button>
        )}
      </div>
      <div className="translation-result">
        <h2>Hasil Terjemahan:</h2>
        <p>{translation || "Lakukan isyarat Anda dan klik 'Selesai Isyarat'."}</p>
      </div>
    </div>
  );
}

export default App;