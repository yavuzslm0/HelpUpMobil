// frontend/src/config.js
import { Platform } from 'react-native';

// Ngrok'un sana verdiği o jilet gibi güvenli adres:
const TUNNEL_URL = 'https://caucus-shale-retinal.ngrok-free.dev';

export const BACKEND_URL = Platform.OS === 'web' ? 'http://localhost:5000' : TUNNEL_URL;