# Smart Sound Recognition Model (Teachable Machine)

An audio classification project that recognises **Clapping**, **Whistling** and **Background Noise** in real time. The model is trained with [Google Teachable Machine](https://teachablemachine.withgoogle.com/) (Audio Project) and run in the browser with TensorFlow.js.


## How it works

1. Teachable Machine records 2-second clips for each class and converts them into spectrograms.
2. A small neural network is trained on those spectrograms (50 epochs, batch size 16, learning rate 0.001).
3. The exported model is loaded by this web app, which listens through the microphone and shows a confidence percentage for each class.

## Project structure

```
.
├── index.html     # page layout
├── style.css      # styling
├── script.js      # loads the model and runs live predictions
├── model/         # exported Teachable Machine files (you add these)
│   ├── model.json
│   ├── metadata.json
│   └── weights.bin
├── .gitignore
└── README.md
```

## Results

| Test sound | Predicted class | Confidence |
|------------|-----------------|-----------|
| Clap       | Clapping        | 96% |
| Whistle    | Whistling       | 91% |
| Room noise | Background Noise| 68% |

Final training accuracy: about 96%. Background Noise scored lower because ambient sound varies more; adding more diverse background samples would improve it.

## Tech stack

- Google Teachable Machine (Audio Project)
- TensorFlow.js + `@tensorflow-models/speech-commands`
- HTML, CSS, JavaScript

