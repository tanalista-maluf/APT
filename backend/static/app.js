// ============================================================
// AutoPost Tabajara! - Logica principal do frontend
// ============================================================

const API_BASE = window.location.origin + "/api";

const MOODS = [
    { id: "maluf", label: "✍️ Meu Estilo" },
    { id: "espirituosa", label: "Espirituosa" },
    { id: "seca", label: "Seca" },
    { id: "ironica", label: "Irônica" },
    { id: "storyteller", label: "Storyteller" },
    { id: "zoeira", label: "Zoeira" },
    { id: "cronica", label: "Crônica" },
];

const PHOTO_FILTERS = {
    none: { label: "Original" },
    "amazing-beach-01": { label: "Amazing Beach 01", brightness: 1.0, contrast: 1.0, saturate: 0.995, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-beach-02": { label: "Amazing Beach 02", brightness: 0.912, contrast: 0.975, saturate: 0.984, temperature: -12.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-beach-03": { label: "Amazing Beach 03", brightness: 0.839, contrast: 0.895, saturate: 0.928, temperature: 15.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-beach-04": { label: "Amazing Beach 04", brightness: 1.052, contrast: 1.135, saturate: 0.91, temperature: 0.0, tint: null, vignette: 0.06, clarity: 0, grayscale: 0 },
    "amazing-beach-05": { label: "Amazing Beach 05", brightness: 1.0, contrast: 1.035, saturate: 1.0, temperature: 4.5, tint: null, vignette: 0.01, clarity: 0, grayscale: 0 },
    "amazing-beauty-01": { label: "Amazing Beauty 01", brightness: 1.035, contrast: 1.0, saturate: 1.004, temperature: 18.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-beauty-02": { label: "Amazing Beauty 02", brightness: 1.07, contrast: 1.0, saturate: 1.02, temperature: 28.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-beauty-03": { label: "Amazing Beauty 03", brightness: 1.0, contrast: 0.935, saturate: 0.913, temperature: 27.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-black-01": { label: "Amazing Black 01", brightness: 1.018, contrast: 1.28, saturate: 1.041, temperature: 0.0, tint: null, vignette: 0.15, clarity: 0, grayscale: 0 },
    "amazing-black-02": { label: "Amazing Black 02", brightness: 1.0, contrast: 1.31, saturate: 1.0, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-black-03": { label: "Amazing Black 03", brightness: 1.123, contrast: 1.44, saturate: 0.953, temperature: 0.0, tint: null, vignette: 0.15, clarity: 0, grayscale: 0 },
    "amazing-black-04": { label: "Amazing Black 04", brightness: 1.0, contrast: 1.155, saturate: 0.98, temperature: 0.0, tint: null, vignette: 0.15, clarity: 0, grayscale: 0 },
    "amazing-black-05": { label: "Amazing Black 05", brightness: 1.0, contrast: 1.06, saturate: 1.0, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-black-white-01": { label: "Amazing Black White 01", brightness: 0.79, contrast: 1.43, saturate: 1.0, temperature: -13.5, tint: { r: 0, g: 50, b: 0, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 1.0 },
    "amazing-black-white-02": { label: "Amazing Black White 02", brightness: 1.105, contrast: 1.29, saturate: 1.0, temperature: -3.0, tint: { r: 0, g: 50, b: 0, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 1.0 },
    "amazing-black-white-03": { label: "Amazing Black White 03", brightness: 0.948, contrast: 1.185, saturate: 1.0, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 1.0 },
    "amazing-black-white-04": { label: "Amazing Black White 04", brightness: 1.105, contrast: 1.185, saturate: 1.0, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 1.0 },
    "amazing-black-white-05": { label: "Amazing Black White 05", brightness: 1.0, contrast: 1.095, saturate: 1.0, temperature: 0.0, tint: null, vignette: 0.01, clarity: 0, grayscale: 1.0 },
    "amazing-blue-01": { label: "Amazing Blue 01", brightness: 1.087, contrast: 1.005, saturate: 0.907, temperature: 15.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-blue-02": { label: "Amazing Blue 02", brightness: 1.0, contrast: 1.0, saturate: 0.941, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-blue-03": { label: "Amazing Blue 03", brightness: 1.0, contrast: 1.0, saturate: 1.0, temperature: -22.5, tint: null, vignette: 0.11, clarity: 0, grayscale: 0 },
    "amazing-blue-04": { label: "Amazing Blue 04", brightness: 1.01, contrast: 1.0, saturate: 0.963, temperature: 4.5, tint: null, vignette: 0.11, clarity: 0, grayscale: 0 },
    "amazing-blue-05": { label: "Amazing Blue 05", brightness: 0.948, contrast: 1.14, saturate: 0.89, temperature: 7.5, tint: { r: 0, g: 50, b: 0, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-blue-06": { label: "Amazing Blue 06", brightness: 1.0, contrast: 0.965, saturate: 1.176, temperature: 6.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.08, clarity: 0, grayscale: 0 },
    "amazing-blue-07": { label: "Amazing Blue 07", brightness: 1.0, contrast: 1.0, saturate: 1.048, temperature: 15.0, tint: { r: 0, g: 50, b: 0, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-blue-08": { label: "Amazing Blue 08", brightness: 1.0, contrast: 1.0, saturate: 0.813, temperature: 0.0, tint: null, vignette: 0.1, clarity: 0, grayscale: 0 },
    "amazing-blue-09": { label: "Amazing Blue 09", brightness: 1.0, contrast: 1.0, saturate: 1.0, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-blue-10": { label: "Amazing Blue 10", brightness: 1.0, contrast: 1.0, saturate: 1.02, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-boho-01": { label: "Amazing Boho 01", brightness: 1.042, contrast: 1.175, saturate: 0.912, temperature: 4.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-boho-02": { label: "Amazing Boho 02", brightness: 1.042, contrast: 1.175, saturate: 0.96, temperature: 9.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-boho-03": { label: "Amazing Boho 03", brightness: 0.948, contrast: 1.105, saturate: 0.919, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-cinematic-01": { label: "Amazing Cinematic 01", brightness: 1.035, contrast: 1.225, saturate: 1.113, temperature: 0.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-cinematic-02": { label: "Amazing Cinematic 02", brightness: 1.042, contrast: 1.0, saturate: 0.817, temperature: 22.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-cinematic-03": { label: "Amazing Cinematic 03", brightness: 1.0, contrast: 1.115, saturate: 1.097, temperature: 0.0, tint: null, vignette: 0.11, clarity: 0, grayscale: 0 },
    "amazing-city-01": { label: "Amazing City 01", brightness: 1.098, contrast: 1.0, saturate: 0.88, temperature: -6.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-city-02": { label: "Amazing City 02", brightness: 0.72, contrast: 1.0, saturate: 0.983, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-city-03": { label: "Amazing City 03", brightness: 1.123, contrast: 1.115, saturate: 0.768, temperature: -6.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-city-04": { label: "Amazing City 04", brightness: 1.105, contrast: 1.235, saturate: 1.351, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-city-05": { label: "Amazing City 05", brightness: 1.01, contrast: 1.0, saturate: 1.193, temperature: 0.0, tint: null, vignette: 0.11, clarity: 0, grayscale: 0 },
    "amazing-coffee-01": { label: "Amazing Coffee 01", brightness: 1.014, contrast: 1.055, saturate: 0.805, temperature: 21.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-coffee-02": { label: "Amazing Coffee 02", brightness: 1.0, contrast: 1.135, saturate: 0.656, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-coffee-03": { label: "Amazing Coffee 03", brightness: 1.231, contrast: 1.185, saturate: 1.03, temperature: 0.0, tint: null, vignette: 0.15, clarity: 0, grayscale: 0 },
    "amazing-color-01": { label: "Amazing Color 01", brightness: 1.287, contrast: 1.09, saturate: 0.96, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-color-02": { label: "Amazing Color 02", brightness: 1.063, contrast: 1.0, saturate: 0.984, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-color-03": { label: "Amazing Color 03", brightness: 1.101, contrast: 1.105, saturate: 1.0, temperature: 7.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-color-04": { label: "Amazing Color 04", brightness: 1.0, contrast: 1.255, saturate: 1.109, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-color-05": { label: "Amazing Color 05", brightness: 1.0, contrast: 1.055, saturate: 0.945, temperature: 6.0, tint: { r: 0, g: 50, b: 0, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-color-06": { label: "Amazing Color 06", brightness: 1.0, contrast: 1.0, saturate: 1.05, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-color-07": { label: "Amazing Color 07", brightness: 1.0, contrast: 1.0, saturate: 0.881, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-color-09": { label: "Amazing Color 09", brightness: 1.123, contrast: 1.11, saturate: 1.183, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-color-10": { label: "Amazing Color 10", brightness: 1.035, contrast: 1.055, saturate: 1.15, temperature: 0.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-food-01": { label: "Amazing Food 01", brightness: 1.0, contrast: 1.0, saturate: 1.071, temperature: 7.5, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-food-02": { label: "Amazing Food 02", brightness: 1.0, contrast: 1.035, saturate: 1.048, temperature: 16.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-food-03": { label: "Amazing Food 03", brightness: 1.129, contrast: 1.165, saturate: 1.261, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-food-04": { label: "Amazing Food 04", brightness: 1.0, contrast: 1.23, saturate: 1.063, temperature: 4.5, tint: null, vignette: 0.01, clarity: 0, grayscale: 0 },
    "amazing-food-05": { label: "Amazing Food 05", brightness: 1.0, contrast: 1.0, saturate: 1.0, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-forest-01": { label: "Amazing Forest 01", brightness: 0.912, contrast: 0.975, saturate: 0.984, temperature: -12.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-forest-02": { label: "Amazing Forest 02", brightness: 1.123, contrast: 0.965, saturate: 0.859, temperature: 0.0, tint: { r: 0, g: 50, b: 0, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-forest-03": { label: "Amazing Forest 03", brightness: 1.0, contrast: 1.125, saturate: 1.103, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-forest-04": { label: "Amazing Forest 04", brightness: 0.912, contrast: 0.965, saturate: 1.201, temperature: 10.5, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-forest-05": { label: "Amazing Forest 05", brightness: 1.196, contrast: 1.0, saturate: 0.88, temperature: 7.5, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-golden-hour-01": { label: "Amazing Golden Hour 01", brightness: 1.123, contrast: 0.825, saturate: 1.111, temperature: 42.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-golden-hour-02": { label: "Amazing Golden Hour 02", brightness: 1.0, contrast: 1.075, saturate: 1.01, temperature: 22.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-golden-hour-03": { label: "Amazing Golden Hour 03", brightness: 1.123, contrast: 0.825, saturate: 1.111, temperature: 22.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-golden-hour-04": { label: "Amazing Golden Hour 04", brightness: 0.878, contrast: 1.0, saturate: 0.72, temperature: 37.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.03, clarity: 0, grayscale: 0 },
    "amazing-golden-hour-05": { label: "Amazing Golden Hour 05", brightness: 1.262, contrast: 1.225, saturate: 1.083, temperature: 22.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-neon-01": { label: "Amazing Neon 01", brightness: 1.105, contrast: 1.145, saturate: 1.491, temperature: -24.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-neon-02": { label: "Amazing Neon 02", brightness: 0.878, contrast: 1.165, saturate: 1.571, temperature: -25.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-neon-03": { label: "Amazing Neon 03", brightness: 1.0, contrast: 1.26, saturate: 1.459, temperature: -52.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-nude-01": { label: "Amazing Nude 01", brightness: 1.0, contrast: 0.9, saturate: 1.0, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-nude-02": { label: "Amazing Nude 02", brightness: 1.024, contrast: 0.945, saturate: 1.003, temperature: 15.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-nude-03": { label: "Amazing Nude 03", brightness: 1.01, contrast: 0.865, saturate: 0.963, temperature: 19.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.11, clarity: 0, grayscale: 0 },
    "amazing-nude-04": { label: "Amazing Nude 04", brightness: 1.0, contrast: 0.815, saturate: 0.816, temperature: 28.5, tint: null, vignette: 0.03, clarity: 0, grayscale: 0 },
    "amazing-nude-05": { label: "Amazing Nude 05", brightness: 1.024, contrast: 0.94, saturate: 0.857, temperature: 34.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-pastel-01": { label: "Amazing Pastel 01", brightness: 1.0, contrast: 1.045, saturate: 1.0, temperature: 0.0, tint: null, vignette: 0.2, clarity: 0, grayscale: 0 },
    "amazing-pastel-02": { label: "Amazing Pastel 02", brightness: 1.0, contrast: 1.085, saturate: 1.0, temperature: -18.0, tint: null, vignette: 0.2, clarity: 0, grayscale: 0 },
    "amazing-pastel-03": { label: "Amazing Pastel 03", brightness: 1.0, contrast: 1.045, saturate: 1.0, temperature: 0.0, tint: { r: 0, g: 50, b: 0, a: 0.05 }, vignette: 0.2, clarity: 0, grayscale: 0 },
    "amazing-pets-01": { label: "Amazing Pets 01", brightness: 1.0, contrast: 1.165, saturate: 0.943, temperature: 37.5, tint: null, vignette: 0.02, clarity: 0, grayscale: 0 },
    "amazing-pets-02": { label: "Amazing Pets 02", brightness: 1.161, contrast: 1.0, saturate: 0.807, temperature: 15.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-pets-03": { label: "Amazing Pets 03", brightness: 1.115, contrast: 1.05, saturate: 1.013, temperature: 0.0, tint: null, vignette: 0.05, clarity: 0, grayscale: 0 },
    "amazing-portrait-01": { label: "Amazing Portrait 01", brightness: 1.07, contrast: 1.095, saturate: 1.037, temperature: 0.0, tint: { r: 0, g: 50, b: 0, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-portrait-02": { label: "Amazing Portrait 02", brightness: 1.01, contrast: 1.0, saturate: 0.963, temperature: 22.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.11, clarity: 0, grayscale: 0 },
    "amazing-portrait-03": { label: "Amazing Portrait 03", brightness: 1.0, contrast: 1.0, saturate: 1.13, temperature: 0.0, tint: null, vignette: 0.11, clarity: 0, grayscale: 0 },
    "amazing-red-01": { label: "Amazing Red 01", brightness: 1.042, contrast: 0.98, saturate: 0.807, temperature: 15.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-red-03": { label: "Amazing Red 03", brightness: 1.018, contrast: 1.135, saturate: 0.907, temperature: 0.0, tint: null, vignette: 0.11, clarity: 0, grayscale: 0 },
    "amazing-rose-01": { label: "Amazing Rose 01", brightness: 0.983, contrast: 1.065, saturate: 1.077, temperature: 0.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-rose-02": { label: "Amazing Rose 02", brightness: 1.052, contrast: 0.935, saturate: 0.913, temperature: 34.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-rose-03": { label: "Amazing Rose 03", brightness: 1.049, contrast: 1.02, saturate: 0.913, temperature: 28.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-rose-04": { label: "Amazing Rose 04", brightness: 1.0, contrast: 0.755, saturate: 0.626, temperature: 31.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-rose-05": { label: "Amazing Rose 05", brightness: 1.231, contrast: 1.095, saturate: 0.863, temperature: 22.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-teal-orange-01": { label: "Amazing Teal Orange 01", brightness: 1.123, contrast: 1.0, saturate: 0.737, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-teal-orange-02": { label: "Amazing Teal Orange 02", brightness: 1.123, contrast: 1.0, saturate: 0.737, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-teal-orange-03": { label: "Amazing Teal Orange 03", brightness: 1.0, contrast: 1.175, saturate: 0.947, temperature: 0.0, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-wedding-01": { label: "Amazing Wedding 01", brightness: 1.0, contrast: 1.16, saturate: 0.695, temperature: 19.5, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-wedding-02": { label: "Amazing Wedding 02", brightness: 1.042, contrast: 1.125, saturate: 0.912, temperature: 4.5, tint: { r: 50, g: 0, b: 50, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-wedding-03": { label: "Amazing Wedding 03", brightness: 1.0, contrast: 1.29, saturate: 0.729, temperature: 0.0, tint: { r: 0, g: 50, b: 0, a: 0.05 }, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-wedding-04": { label: "Amazing Wedding 04", brightness: 1.0, contrast: 0.795, saturate: 0.608, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-white-01": { label: "Amazing White 01", brightness: 1.14, contrast: 1.055, saturate: 1.0, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
    "amazing-white-02": { label: "Amazing White 02", brightness: 1.0, contrast: 0.985, saturate: 0.834, temperature: 0.0, tint: null, vignette: 0.19, clarity: 0, grayscale: 0 },
    "amazing-white-03": { label: "Amazing White 03", brightness: 1.0, contrast: 1.27, saturate: 1.007, temperature: 0.0, tint: null, vignette: 0.0, clarity: 0, grayscale: 0 },
};

const PAGE_TITLES = {
    dashboard: "Dashboard",
    content: "Conteúdo",
    calendar: "Calendário",
    history: "Histórico",
    settings: "Configurações",
};

const PROGRESS_STEPS = [
    "📤 Enviando fotos...",
    "🔍 Analisando fotos (EXIF e localização)...",
    "✍️ Criando legendas com Claude...",
    "🏷️ Selecionando hashtags...",
];

// Estado global
let selectedPhotos = [];       // fotos do lote de "nova postagem" em andamento
let currentModalIndex = 0;
let selectedFrequency = 1;

let queueData = [];             // todos os posts vindos do backend
let currentHistoryFilter = "all";
let currentContentFilter = "all";
let _dashboardPollTimer = null;

let calendarViewDate = new Date();
calendarViewDate.setDate(1);
let selectedDayKey = null;

let editingPostId = null;
let deletingPostId = null;

// ============================================================
// INICIALIZACAO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initAuth();

    setupLogin();
    setupSidebar();
    setupDropzone();
    setupNewPostModal();
    setupScheduleModal();
    setupEditModal();
    setupDeleteModal();
    setupPublishModal();
    setupFilters();
    setupAccountSwitcher();
    loadClubLink();
    loadIgAccounts();
});

// Ajusta o link "voltar ao 30ºS" conforme a config do servidor (CLUB_URL).
// O HTML já tem um endereço padrão, então funciona mesmo antes desta chamada.
async function loadClubLink() {
    try {
        const res = await fetch(`${API_BASE}/app-info`, { credentials: "same-origin" });
        const data = await res.json();
        if (data.club_url) {
            document.getElementById("clubBackLink").href = data.club_url;
        }
    } catch (e) {
        // mantém o href padrão do HTML
    }
}

// ============================================================
// HELPERS GERAIS
// ============================================================

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatDateBR(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthLabel(date) {
    const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return `${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatKeyLongBR(key) {
    const [y, m, d] = key.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return capitalize(date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }));
}

function showToast(message, type = "success", duration = 4500) {
    const container = document.getElementById("toastContainer");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), duration);
}

// Wrapper de fetch: se o servidor pedir login (401), mostra a tela de senha.
async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, { credentials: "same-origin", cache: "no-store", ...options });
    if (res.status === 401) {
        showLogin();
    }
    return res;
}

// ============================================================
// LOGIN / AUTENTICACAO
// ============================================================

async function initAuth() {
    try {
        const res = await fetch(`${API_BASE}/auth-status`, { credentials: "same-origin" });
        const data = await res.json();
        if (data.auth_required && !data.authenticated) {
            showLogin();
        } else {
            showApp();
        }
    } catch (e) {
        showApp();
    }
}

function showLogin() {
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("appShell").classList.add("hidden");
}

function showApp() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appShell").classList.remove("hidden");
    loadQueue();
    _startDashboardPoll();
}

function setupLogin() {
    const input = document.getElementById("loginPasswordInput");
    const errorEl = document.getElementById("loginError");

    async function doLogin() {
        errorEl.classList.add("hidden");
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: input.value })
            });
            if (res.ok) {
                input.value = "";
                showApp();
            } else {
                errorEl.classList.remove("hidden");
            }
        } catch (e) {
            errorEl.textContent = "Erro de conexão. Tente novamente.";
            errorEl.classList.remove("hidden");
        }
    }

    document.getElementById("loginBtn").addEventListener("click", doLogin);
    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") doLogin();
    });
}

async function logout() {
    try {
        await apiFetch("/logout", { method: "POST" });
    } catch (e) {
        // segue o jogo - mostra login de qualquer forma
    }
    showLogin();
}

// ============================================================
// CONEXAO COM BACKEND (status pill)
// ============================================================

// ============================================================
// SIDEBAR / NAVEGACAO ENTRE PAGINAS
// ============================================================

function closeMobileMenu() {
    document.querySelector(".sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("active");
}

function setupSidebar() {
    document.getElementById("hamburgerBtn").addEventListener("click", () => {
        document.querySelector(".sidebar").classList.toggle("open");
        document.getElementById("sidebarOverlay").classList.toggle("active");
    });

    document.getElementById("sidebarOverlay").addEventListener("click", closeMobileMenu);

    document.querySelectorAll(".side-nav-item[data-page]").forEach((btn) => {
        btn.addEventListener("click", () => {
            switchPage(btn.dataset.page);
            closeMobileMenu();
        });
    });

    document.querySelectorAll(".link-btn[data-page]").forEach((btn) => {
        btn.addEventListener("click", () => switchPage(btn.dataset.page));
    });

    document.getElementById("navNewPost").addEventListener("click", () => {
        closeMobileMenu();
        document.getElementById("photoInput").click();
    });

    document.getElementById("userAvatarBtn").addEventListener("click", () => switchPage("settings"));
}

function switchPage(pageName) {
    document.querySelectorAll(".side-nav-item[data-page]").forEach((b) => {
        b.classList.toggle("active", b.dataset.page === pageName);
    });
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    document.getElementById(`page-${pageName}`).classList.add("active");
    document.getElementById("pageTitle").textContent = PAGE_TITLES[pageName] || "Dashboard";

    if (pageName === "calendar") {
        selectedDayKey = null;
        renderFullCalendarPage();
    } else if (pageName === "history") {
        renderHistoryList();
    } else if (pageName === "content") {
        renderContentGrid();
    } else if (pageName === "settings") {
        loadSettingsPage();
    }

    if (pageName === "dashboard") {
        loadQueue();
        _startDashboardPoll();
    } else {
        _stopDashboardPoll();
    }
}

function _startDashboardPoll() {
    _stopDashboardPoll();
    _dashboardPollTimer = setInterval(loadQueue, 600000);
}

function _stopDashboardPoll() {
    if (_dashboardPollTimer) {
        clearInterval(_dashboardPollTimer);
        _dashboardPollTimer = null;
    }
}

document.addEventListener("visibilitychange", () => {
    const onDashboard = document.getElementById("page-dashboard")?.classList.contains("active");
    if (!onDashboard) return;
    if (document.hidden) {
        _stopDashboardPoll();
    } else {
        loadQueue();
        _startDashboardPoll();
    }
});

(function setupPullToRefresh() {
    let startY = 0;
    let pulling = false;
    const THRESHOLD = 80;
    const ptr = document.getElementById("pullToRefresh");
    const page = document.getElementById("page-dashboard");

    page.addEventListener("touchstart", (e) => {
        if (window.scrollY > 0 || !page.classList.contains("active")) return;
        startY = e.touches[0].clientY;
        pulling = true;
    }, { passive: true });

    page.addEventListener("touchmove", (e) => {
        if (!pulling) return;
        const dy = e.touches[0].clientY - startY;
        if (dy > 10 && window.scrollY === 0) {
            ptr.classList.add("visible");
        }
    }, { passive: true });

    page.addEventListener("touchend", async () => {
        if (!pulling) return;
        pulling = false;
        if (!ptr.classList.contains("visible")) return;
        ptr.classList.remove("visible");
        ptr.classList.add("refreshing");
        await loadQueue();
        ptr.classList.remove("refreshing");
    });
})();

// ============================================================
// UPLOAD DE FOTOS (dropzone + pipeline de processamento)
// ============================================================

function setupDropzone() {
    const input = document.getElementById("photoInput");
    const inner = document.getElementById("dropzoneInner");

    inner.addEventListener("click", () => input.click());

    input.addEventListener("change", (e) => {
        handleNewFiles(e.target.files);
        input.value = "";
    });

    inner.addEventListener("dragover", (e) => {
        e.preventDefault();
        inner.classList.add("drag-over");
    });
    inner.addEventListener("dragleave", () => inner.classList.remove("drag-over"));
    inner.addEventListener("drop", (e) => {
        e.preventDefault();
        inner.classList.remove("drag-over");
        if (e.dataTransfer.files.length > 0) handleNewFiles(e.dataTransfer.files);
    });
}

function showProgressCard() {
    document.getElementById("progressCard").classList.remove("hidden");
    renderProgressChecklist(0);
}

function hideProgressCard() {
    document.getElementById("progressCard").classList.add("hidden");
}

// Rodinha global e discreta no topo - visível de qualquer página enquanto
// as fotos são enviadas/processadas/analisadas.
function showTopbarSpinner(text) {
    document.getElementById("topbarSpinnerText").textContent = text || "Processando...";
    document.getElementById("topbarSpinner").classList.remove("hidden");
}

function updateTopbarSpinner(text) {
    document.getElementById("topbarSpinnerText").textContent = text;
}

function hideTopbarSpinner() {
    document.getElementById("topbarSpinner").classList.add("hidden");
}

// Troca o conteúdo da dropzone por uma rodinha enquanto processa, e restaura
// depois. O elemento em si permanece, então os listeners de clique/drop seguem valendo.
function setDropzoneBusy(busy, text) {
    const inner = document.getElementById("dropzoneInner");
    if (busy) {
        inner.innerHTML = `
            <span class="spinner spinner-dark dropzone-spinner"></span>
            <p class="dropzone-text">${text || "Processando..."}</p>
            <p class="dropzone-hint">Aguarde, a mágica Tabajara está acontecendo</p>`;
    } else {
        inner.innerHTML = `
            <span class="dropzone-icon">☁️</span>
            <p class="dropzone-text">Solte suas fotos aqui ou clique para enviar</p>
            <p class="dropzone-hint">JPG, PNG, HEIC — pode escolher várias de uma vez</p>`;
    }
}

function renderProgressChecklist(activeIndex) {
    const list = document.getElementById("progressChecklist");
    list.innerHTML = "";
    PROGRESS_STEPS.forEach((label, i) => {
        const li = document.createElement("li");
        if (i < activeIndex) li.classList.add("done");
        const check = document.createElement("span");
        check.className = "check";
        check.textContent = i < activeIndex ? "✅" : (i === activeIndex ? "⏳" : "⬜");
        const text = document.createElement("span");
        text.textContent = label;
        li.appendChild(check);
        li.appendChild(text);
        list.appendChild(li);
    });
}

async function handleNewFiles(fileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    selectedPhotos = [];
    const analysisErrors = [];
    const total = files.length;
    const plural = total > 1 ? "s" : "";

    showProgressCard();
    showTopbarSpinner(`Enviando ${total} foto${plural}...`);
    setDropzoneBusy(true, `Enviando ${total} foto${plural}...`);

    try {
        for (const file of files) {
            const rawBase64 = await fileToBase64(file);
            selectedPhotos.push({
                id: `photo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                file,
                base64: rawBase64,
                exif: null,
                caption: "",
                captionOptions: [],
                hashtags: [],
                location: "",
                taggedPeople: [],
                contentType: "",
                activeMood: null,
                processingError: null,
            });
        }
        renderProgressChecklist(1);

        for (let i = 0; i < selectedPhotos.length; i++) {
            const msg = `Analisando foto ${i + 1} de ${total}...`;
            updateTopbarSpinner(msg);
            setDropzoneBusy(true, msg);
            await processPhotoOnServer(selectedPhotos[i]);
        }
        renderProgressChecklist(2);

        for (let i = 0; i < selectedPhotos.length; i++) {
            const photo = selectedPhotos[i];
            if (photo.processingError) continue;
            const msg = `Gerando legenda ${i + 1} de ${total} com IA...`;
            updateTopbarSpinner(msg);
            setDropzoneBusy(true, msg);
            try {
                const res = await apiFetch(`/analyze-image`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        photo: photo.base64,
                        location: photo.location || "",
                        date: (photo.exif && photo.exif.dateTime) || ""
                    })
                });
                const data = await res.json();
                if (data.success) {
                    photo.captionOptions = data.captions || [];
                    photo.caption = data.caption || "";
                    photo.hashtags = data.hashtags || [];
                    photo.contentType = data.content_type || "";
                } else if (data.error) {
                    analysisErrors.push(data.error);
                }
            } catch (e) {
                analysisErrors.push("Falha de conexão com o servidor.");
            }
        }
        renderProgressChecklist(4);
        await sleep(300);
    } finally {
        hideProgressCard();
        hideTopbarSpinner();
        setDropzoneBusy(false);
    }

    const withErrors = selectedPhotos.filter((p) => p.processingError);
    if (withErrors.length > 0) {
        showToast(`${withErrors.length} foto(s) não puderam ser processadas e foram ignoradas.`, "error");
        selectedPhotos = selectedPhotos.filter((p) => !p.processingError);
    }
    if (analysisErrors.length > 0) {
        showToast(`A análise com IA falhou em ${analysisErrors.length} foto(s). Você pode escrever as legendas manualmente.`, "error");
    }
    if (selectedPhotos.length === 0) {
        showToast("Nenhuma foto pôde ser processada.", "error");
        return;
    }

    currentModalIndex = 0;
    openNewPostModal();
}

async function processPhotoOnServer(photo) {
    try {
        const res = await apiFetch(`/process-photo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photo: photo.base64 })
        });
        const data = await res.json();

        if (data.success) {
            photo.base64 = data.normalized_photo;
            photo.exif = data.exif;
            photo.location = data.exif.locationName || "";
        } else {
            photo.processingError = data.error || "Erro ao processar foto";
        }
    } catch (e) {
        photo.processingError = "Não foi possível conectar ao servidor";
    }
}

// ============================================================
// FILTROS DE FOTO (Canvas API)
// ============================================================

let _filterOriginalImage = null;

// ============================================================
// CROP / ROTATION / ZOOM
// ============================================================

const ASPECT_RATIOS = {
    "free": null,
    "1:1": 1,
    "4:5": 4 / 5,
    "1.91:1": 1.91,
};

let _cropState = { panX: 0, panY: 0, zoom: 100, rotation: 0, aspect: "4:5" };
let _isDragging = false;
let _dragStart = { x: 0, y: 0, panX: 0, panY: 0 };

function getCropState() {
    const photo = getCurrentPhoto();
    if (!photo) return _cropState;
    if (!photo.cropState) {
        photo.cropState = { panX: 0, panY: 0, zoom: 100, rotation: 0, aspect: "4:5" };
    }
    return photo.cropState;
}

function updateViewportAspect() {
    const state = getCropState();
    const viewport = document.getElementById("cropViewport");
    const ratio = ASPECT_RATIOS[state.aspect];
    if (!ratio) {
        if (_filterOriginalImage) {
            const isRotated = state.rotation % 180 !== 0;
            const w = isRotated ? _filterOriginalImage.naturalHeight : _filterOriginalImage.naturalWidth;
            const h = isRotated ? _filterOriginalImage.naturalWidth : _filterOriginalImage.naturalHeight;
            viewport.style.aspectRatio = `${w / h}`;
        } else {
            viewport.style.aspectRatio = "1";
        }
    } else {
        viewport.style.aspectRatio = `${ratio}`;
    }
}

function updateCropTransform() {
    const state = getCropState();
    const img = document.getElementById("newPostImage");
    const canvas = document.getElementById("filterCanvas");
    const viewport = document.getElementById("cropViewport");

    if (!_filterOriginalImage) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const isRotated = state.rotation % 180 !== 0;
    const natW = _filterOriginalImage.naturalWidth;
    const natH = _filterOriginalImage.naturalHeight;
    const imgW = isRotated ? natH : natW;
    const imgH = isRotated ? natW : natH;

    const scaleToFit = Math.max(vw / imgW, vh / imgH);
    const zoom = state.zoom / 100;
    const finalScale = scaleToFit * zoom;

    const displayW = natW * finalScale;
    const displayH = natH * finalScale;

    const maxPanX = Math.max(0, ((isRotated ? displayH : displayW) - vw) / 2);
    const maxPanY = Math.max(0, ((isRotated ? displayW : displayH) - vh) / 2);
    state.panX = Math.max(-maxPanX, Math.min(maxPanX, state.panX));
    state.panY = Math.max(-maxPanY, Math.min(maxPanY, state.panY));

    state._viewportW = vw;
    state._viewportH = vh;

    const transform = `translate(${state.panX}px, ${state.panY}px) rotate(${state.rotation}deg) scale(${finalScale})`;

    [img, canvas].forEach(el => {
        el.style.width = `${natW}px`;
        el.style.height = `${natH}px`;
        el.style.transform = transform;
        el.style.left = `${(vw - natW) / 2}px`;
        el.style.top = `${(vh - natH) / 2}px`;
    });
}

function clampPan() {
    updateCropTransform();
}

function setupCropControls() {
    const viewport = document.getElementById("cropViewport");

    document.getElementById("rotateLeftBtn").addEventListener("click", () => {
        const state = getCropState();
        state.rotation = (state.rotation - 90 + 360) % 360;
        state.panX = 0;
        state.panY = 0;
        updateCropTransform();
    });

    document.getElementById("rotateRightBtn").addEventListener("click", () => {
        const state = getCropState();
        state.rotation = (state.rotation + 90) % 360;
        state.panX = 0;
        state.panY = 0;
        updateCropTransform();
    });

    document.getElementById("aspectRatioSelect").addEventListener("change", (e) => {
        const state = getCropState();
        state.aspect = e.target.value;
        state.panX = 0;
        state.panY = 0;
        updateViewportAspect();
        updateCropTransform();
    });

    document.getElementById("cropZoom").addEventListener("input", (e) => {
        const state = getCropState();
        state.zoom = parseInt(e.target.value);
        document.getElementById("cropZoomValue").textContent = state.zoom + "%";
        updateCropTransform();
    });

    document.getElementById("cropResetBtn").addEventListener("click", () => {
        const photo = getCurrentPhoto();
        if (photo) {
            photo.cropState = { panX: 0, panY: 0, zoom: 100, rotation: 0, aspect: "4:5" };
        }
        document.getElementById("cropZoom").value = 100;
        document.getElementById("cropZoomValue").textContent = "100%";
        document.getElementById("aspectRatioSelect").value = "4:5";
        updateViewportAspect();
        updateCropTransform();
    });

    // Pan via mouse
    viewport.addEventListener("mousedown", (e) => {
        e.preventDefault();
        _isDragging = true;
        const state = getCropState();
        _dragStart = { x: e.clientX, y: e.clientY, panX: state.panX, panY: state.panY };
    });

    window.addEventListener("mousemove", (e) => {
        if (!_isDragging) return;
        const state = getCropState();
        state.panX = _dragStart.panX + (e.clientX - _dragStart.x);
        state.panY = _dragStart.panY + (e.clientY - _dragStart.y);
        updateCropTransform();
    });

    window.addEventListener("mouseup", () => { _isDragging = false; });

    // Pan via touch
    viewport.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            _isDragging = true;
            const t = e.touches[0];
            const state = getCropState();
            _dragStart = { x: t.clientX, y: t.clientY, panX: state.panX, panY: state.panY };
        }
    }, { passive: true });

    viewport.addEventListener("touchmove", (e) => {
        if (!_isDragging || e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        const state = getCropState();
        state.panX = _dragStart.panX + (t.clientX - _dragStart.x);
        state.panY = _dragStart.panY + (t.clientY - _dragStart.y);
        updateCropTransform();
    }, { passive: false });

    viewport.addEventListener("touchend", () => { _isDragging = false; });
}

function restoreCropUI() {
    const state = getCropState();
    document.getElementById("cropZoom").value = state.zoom;
    document.getElementById("cropZoomValue").textContent = state.zoom + "%";
    document.getElementById("aspectRatioSelect").value = state.aspect;
    updateViewportAspect();
}

function applyPhotoFilter() {
    const filterKey = document.getElementById("filterSelect").value;
    const intensity = parseInt(document.getElementById("filterIntensity").value) / 100;
    document.getElementById("filterIntensityValue").textContent = Math.round(intensity * 100) + "%";

    const photo = getCurrentPhoto();
    if (!photo) return;

    photo.filterKey = filterKey;
    photo.filterIntensity = Math.round(intensity * 100);

    if (filterKey === "none" || intensity === 0) {
        document.getElementById("newPostImage").style.display = "";
        document.getElementById("filterCanvas").style.display = "none";
        updateCropTransform();
        return;
    }

    if (!_filterOriginalImage) return;

    const filter = PHOTO_FILTERS[filterKey];
    if (!filter) return;

    const canvas = document.getElementById("filterCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const img = _filterOriginalImage;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const b = 1 + ((filter.brightness || 1) - 1) * intensity;
    const c = 1 + ((filter.contrast || 1) - 1) * intensity;
    const s = filter.grayscale
        ? 1 - intensity
        : 1 + ((filter.saturate || 1) - 1) * intensity;

    let cssFilter = `brightness(${b}) contrast(${c}) saturate(${s})`;
    if (filter.grayscale) {
        cssFilter += ` grayscale(${intensity})`;
    }
    if (filter.temperature) {
        const hueShift = filter.temperature * 0.5 * intensity;
        cssFilter += ` hue-rotate(${hueShift}deg)`;
    }

    ctx.filter = cssFilter;
    ctx.drawImage(img, 0, 0);
    ctx.filter = "none";

    if (filter.tint) {
        const t = filter.tint;
        ctx.fillStyle = `rgba(${t.r},${t.g},${t.b},${(t.a || 0.05) * intensity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (filter.clarity && filter.clarity > 0) {
        ctx.globalCompositeOperation = "overlay";
        ctx.globalAlpha = filter.clarity * intensity * 0.3;
        ctx.drawImage(canvas, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
    }

    if (filter.vignette && filter.vignette > 0) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const r = Math.max(cx, cy);
        const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.2);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, `rgba(0,0,0,${filter.vignette * intensity})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    document.getElementById("newPostImage").style.display = "none";
    canvas.style.display = "";
    updateCropTransform();
}

function getFilteredBase64(photo) {
    const crop = photo.cropState || { panX: 0, panY: 0, zoom: 100, rotation: 0, aspect: "4:5" };
    const hasFilter = photo.filterKey && photo.filterKey !== "none" && photo.filterIntensity;
    const hasCrop = crop.zoom !== 100 || crop.rotation !== 0 || crop.panX !== 0 || crop.panY !== 0 || (crop.aspect && crop.aspect !== "free");

    if (!hasFilter && !hasCrop) {
        return photo.base64;
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const natW = img.naturalWidth;
            const natH = img.naturalHeight;
            const isRotated = crop.rotation % 180 !== 0;
            const srcW = isRotated ? natH : natW;
            const srcH = isRotated ? natW : natH;

            const ratio = ASPECT_RATIOS[crop.aspect];
            let outW, outH;
            if (ratio) {
                if (srcW / srcH > ratio) {
                    outH = srcH;
                    outW = Math.round(srcH * ratio);
                } else {
                    outW = srcW;
                    outH = Math.round(srcW / ratio);
                }
            } else {
                outW = srcW;
                outH = srcH;
            }

            const zoom = crop.zoom / 100;
            const scaleToFit = Math.max(outW / srcW, outH / srcH);
            const finalScale = scaleToFit * zoom;

            const c = document.createElement("canvas");
            c.width = outW;
            c.height = outH;
            const ctx = c.getContext("2d");

            const filter = hasFilter ? PHOTO_FILTERS[photo.filterKey] : null;
            if (filter) {
                const intensity = (photo.filterIntensity || 100) / 100;
                const b = 1 + ((filter.brightness || 1) - 1) * intensity;
                const co = 1 + ((filter.contrast || 1) - 1) * intensity;
                const s = filter.grayscale ? 1 - intensity : 1 + ((filter.saturate || 1) - 1) * intensity;
                let cssF = `brightness(${b}) contrast(${co}) saturate(${s})`;
                if (filter.grayscale) cssF += ` grayscale(${intensity})`;
                if (filter.temperature) cssF += ` hue-rotate(${filter.temperature * 0.5 * intensity}deg)`;
                ctx.filter = cssF;
            }

            const vpW = crop._viewportW || 400;
            const vpH = crop._viewportH || 400;
            const panXScaled = crop.panX * (outW / vpW);
            const panYScaled = crop.panY * (outH / vpH);

            ctx.save();
            ctx.translate(outW / 2 + panXScaled, outH / 2 + panYScaled);
            ctx.rotate((crop.rotation * Math.PI) / 180);
            ctx.scale(finalScale, finalScale);
            ctx.drawImage(img, -natW / 2, -natH / 2);
            ctx.restore();
            ctx.filter = "none";

            if (filter) {
                const intensity = (photo.filterIntensity || 100) / 100;
                if (filter.tint) {
                    const t = filter.tint;
                    ctx.fillStyle = `rgba(${t.r},${t.g},${t.b},${(t.a || 0.05) * intensity})`;
                    ctx.fillRect(0, 0, c.width, c.height);
                }
                if (filter.clarity && filter.clarity > 0) {
                    ctx.globalCompositeOperation = "overlay";
                    ctx.globalAlpha = filter.clarity * intensity * 0.3;
                    ctx.drawImage(c, 0, 0);
                    ctx.globalCompositeOperation = "source-over";
                    ctx.globalAlpha = 1.0;
                }
                if (filter.vignette && filter.vignette > 0) {
                    const cx = c.width / 2, cy = c.height / 2;
                    const r = Math.max(cx, cy);
                    const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.2);
                    grad.addColorStop(0, "rgba(0,0,0,0)");
                    grad.addColorStop(1, `rgba(0,0,0,${filter.vignette * intensity})`);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, c.width, c.height);
                }
            }
            resolve(c.toDataURL("image/jpeg", 1.0));
        };
        img.src = photo.base64;
    });
}

// ============================================================
// MODAL: NOVA POSTAGEM (revisão foto a foto)
// ============================================================

function setupNewPostModal() {
    document.getElementById("closeNewPostBtn").addEventListener("click", () => {
        document.getElementById("newPostModal").classList.add("hidden");
        selectedPhotos = [];
    });

    document.getElementById("movePhotoUpBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        if (currentModalIndex > 0) {
            [selectedPhotos[currentModalIndex - 1], selectedPhotos[currentModalIndex]] =
                [selectedPhotos[currentModalIndex], selectedPhotos[currentModalIndex - 1]];
            currentModalIndex--;
            renderNewPostCard();
        }
    });

    document.getElementById("movePhotoDownBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        if (currentModalIndex < selectedPhotos.length - 1) {
            [selectedPhotos[currentModalIndex], selectedPhotos[currentModalIndex + 1]] =
                [selectedPhotos[currentModalIndex + 1], selectedPhotos[currentModalIndex]];
            currentModalIndex++;
            renderNewPostCard();
        }
    });

    document.getElementById("prevPhotoBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        if (currentModalIndex > 0) {
            currentModalIndex--;
            renderNewPostCard();
        }
    });

    document.getElementById("nextPhotoBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        if (currentModalIndex < selectedPhotos.length - 1) {
            currentModalIndex++;
            renderNewPostCard();
        }
    });

    document.getElementById("addHashtagBtn").addEventListener("click", addHashtagToCurrent);
    document.getElementById("newHashtagInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addHashtagToCurrent();
        }
    });

    document.getElementById("regenHashtagsBtn").addEventListener("click", regenerateHashtags);

    // Populate filter dropdown with optgroups by category
    const filterSelect = document.getElementById("filterSelect");
    const groups = {};
    for (const [key, f] of Object.entries(PHOTO_FILTERS)) {
        if (key === "none") continue;
        const parts = f.label.replace(/\s+\d+$/, "");
        if (!groups[parts]) groups[parts] = [];
        groups[parts].push({ key, label: f.label });
    }
    for (const [groupName, items] of Object.entries(groups)) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = groupName;
        for (const item of items) {
            const opt = document.createElement("option");
            opt.value = item.key;
            opt.textContent = item.label;
            optgroup.appendChild(opt);
        }
        filterSelect.appendChild(optgroup);
    }

    filterSelect.addEventListener("change", applyPhotoFilter);
    document.getElementById("filterIntensity").addEventListener("input", applyPhotoFilter);

    setupCropControls();

    document.getElementById("reviewScheduleBtn").addEventListener("click", () => {
        saveCurrentReviewFields();
        openScheduleModal();
    });
}

function openNewPostModal() {
    document.getElementById("newPostModal").classList.remove("hidden");
    renderNewPostCard();
}

function getCurrentPhoto() {
    return selectedPhotos[currentModalIndex];
}

function renderNewPostCard() {
    const photo = getCurrentPhoto();
    if (!photo) return;

    document.getElementById("newPostPosition").textContent = `${currentModalIndex + 1} de ${selectedPhotos.length}`;
    document.getElementById("movePhotoUpBtn").disabled = currentModalIndex === 0;
    document.getElementById("movePhotoDownBtn").disabled = currentModalIndex >= selectedPhotos.length - 1;
    document.getElementById("newPostImage").src = photo.base64;
    document.getElementById("newPostImage").style.display = "";
    document.getElementById("filterCanvas").style.display = "none";

    _filterOriginalImage = new Image();
    _filterOriginalImage.onload = () => {
        document.getElementById("filterSelect").value = photo.filterKey || "none";
        document.getElementById("filterIntensity").value = photo.filterIntensity || 100;
        document.getElementById("filterIntensityValue").textContent = (photo.filterIntensity || 100) + "%";
        restoreCropUI();
        updateCropTransform();
        if (photo.filterKey && photo.filterKey !== "none") applyPhotoFilter();
    };
    _filterOriginalImage.src = photo.base64;

    if (photo.exif) {
        const settings = [
            photo.exif.cameraModel,
            photo.exif.focalLength ? `${photo.exif.focalLength}mm` : null,
            photo.exif.aperture ? `f/${photo.exif.aperture}` : null,
            photo.exif.iso ? `ISO${photo.exif.iso}` : null
        ].filter(Boolean).join(" • ");

        document.getElementById("exifCamera").textContent = settings || "Câmera desconhecida";
        document.getElementById("exifDate").textContent = photo.exif.dateTime ? `🕐 ${photo.exif.dateTime}` : "";
    } else {
        document.getElementById("exifCamera").textContent = "Sem dados EXIF";
        document.getElementById("exifDate").textContent = "";
    }
    document.getElementById("exifLocationLine").textContent = photo.location
        ? `📍 ${photo.location}`
        : "📍 Sem dados de localização";

    document.getElementById("captionTextarea").value = photo.caption || "";
    document.getElementById("locationInput").value = photo.location || "";
    document.getElementById("taggedPeopleInput").value = (photo.taggedPeople || []).join(", ");

    renderMoodChips(photo);
    renderHashtagList(photo);

    document.getElementById("prevPhotoBtn").disabled = currentModalIndex === 0;
    document.getElementById("nextPhotoBtn").disabled = currentModalIndex === selectedPhotos.length - 1;
}

function renderMoodChips(photo, loadingMood = null) {
    const container = document.getElementById("moodChips");
    container.innerHTML = "";

    MOODS.forEach((mood) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mood-chip" + (photo.activeMood === mood.id ? " active" : "");
        btn.textContent = loadingMood === mood.id ? "Gerando..." : mood.label;
        btn.disabled = loadingMood !== null;
        btn.addEventListener("click", () => applyMood(photo, mood.id));
        container.appendChild(btn);
    });
}

async function applyMood(photo, moodId) {
    saveCurrentReviewFields();
    const currentCaption = document.getElementById("captionTextarea").value;
    renderMoodChips(photo, moodId);

    try {
        const res = await apiFetch(`/rewrite-caption`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                caption: currentCaption,
                mood: moodId,
                location: photo.location || "",
                content_type: photo.contentType || ""
            })
        });
        const data = await res.json();
        if (data.success) {
            photo.caption = data.caption;
            photo.activeMood = moodId;
            document.getElementById("captionTextarea").value = data.caption;
        } else if (data.error) {
            showToast(data.error, "error");
        }
    } catch (e) {
        showToast("Erro ao gerar legenda. Verifique a conexão.", "error");
    } finally {
        renderMoodChips(photo);
    }
}

function renderHashtagList(photo) {
    const list = document.getElementById("hashtagList");
    list.innerHTML = "";

    (photo.hashtags || []).forEach((tag) => {
        const chip = document.createElement("div");
        chip.className = "hashtag-chip";
        chip.innerHTML = `<span>${escapeHtml(tag)}</span><button>×</button>`;
        chip.querySelector("button").addEventListener("click", () => {
            photo.hashtags = photo.hashtags.filter((t) => t !== tag);
            renderHashtagList(photo);
        });
        list.appendChild(chip);
    });
}

function addHashtagToCurrent() {
    const input = document.getElementById("newHashtagInput");
    let tag = input.value.trim();
    if (!tag) return;
    if (!tag.startsWith("#")) tag = "#" + tag;

    const photo = getCurrentPhoto();
    if (!photo) return;

    if (!photo.hashtags) photo.hashtags = [];
    if (!photo.hashtags.includes(tag)) {
        photo.hashtags.push(tag);
        renderHashtagList(photo);
    }
    input.value = "";
}

async function regenerateHashtags() {
    const photo = getCurrentPhoto();
    if (!photo) return;

    saveCurrentReviewFields();

    if (!photo.caption && !photo.location) {
        showToast("Escreva uma legenda (ou preencha o local) antes de gerar as hashtags.", "error");
        return;
    }

    const btn = document.getElementById("regenHashtagsBtn");
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Gerando...";

    try {
        const res = await apiFetch(`/generate-hashtags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                caption: photo.caption || "",
                location: photo.location || "",
                content_type: photo.contentType || ""
            })
        });
        const data = await res.json();
        if (data.success) {
            photo.hashtags = data.hashtags || [];
            renderHashtagList(photo);
        } else if (data.error) {
            showToast(data.error, "error");
        }
    } catch (e) {
        showToast("Erro ao gerar hashtags. Verifique a conexão.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function saveCurrentReviewFields() {
    const photo = getCurrentPhoto();
    if (!photo) return;

    photo.caption = document.getElementById("captionTextarea").value;
    photo.location = document.getElementById("locationInput").value;
    photo.taggedPeople = document.getElementById("taggedPeopleInput").value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    photo.filterKey = document.getElementById("filterSelect").value;
    photo.filterIntensity = parseInt(document.getElementById("filterIntensity").value);
}

// ============================================================
// MODAL: AGENDAMENTO
// ============================================================

function setupScheduleModal() {
    document.querySelectorAll(".freq-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".freq-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            selectedFrequency = parseInt(btn.dataset.freq);
            updateScheduleSummary();
        });
    });

    document.getElementById("backToReviewBtn").addEventListener("click", backToReview);
    document.getElementById("closeScheduleBtn").addEventListener("click", backToReview);
    document.getElementById("confirmScheduleBtn").addEventListener("click", confirmAndSchedule);
    setupTimeWindowListeners();
}

function openScheduleModal() {
    document.getElementById("newPostModal").classList.add("hidden");
    document.getElementById("scheduleModal").classList.remove("hidden");

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("startDateInput").value = now.toISOString().slice(0, 16);

    populateAccountSelectors();
    updateScheduleSummary();
}

function backToReview() {
    document.getElementById("scheduleModal").classList.add("hidden");
    document.getElementById("newPostModal").classList.remove("hidden");
    renderNewPostCard();
}

function updateScheduleSummary() {
    const total = selectedPhotos.length;
    const days = Math.ceil(total / selectedFrequency) || 0;
    document.getElementById("summaryTotalPhotos").textContent = total;
    document.getElementById("summaryDuration").textContent = `${days} dia(s)`;
    document.getElementById("summaryFrequency").textContent = `${selectedFrequency}x/dia`;
}

function setupTimeWindowListeners() {
    document.getElementById("windowStartTime").addEventListener("change", updateScheduleSummary);
    document.getElementById("windowEndTime").addEventListener("change", updateScheduleSummary);
}

async function confirmAndSchedule() {
    const total = selectedPhotos.length;
    const confirmBtn = document.getElementById("confirmScheduleBtn");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Agendando...";

    const startDateValue = document.getElementById("startDateInput").value;
    const startDate = startDateValue ? new Date(startDateValue) : new Date();

    const winStart = document.getElementById("windowStartTime").value || "08:00";
    const winEnd = document.getElementById("windowEndTime").value || "22:00";
    const [wsH, wsM] = winStart.split(":").map(Number);
    const [weH, weM] = winEnd.split(":").map(Number);
    const windowMinutes = (weH * 60 + weM) - (wsH * 60 + wsM);
    const slotMinutes = selectedFrequency > 1
        ? Math.floor(windowMinutes / (selectedFrequency - 1))
        : 0;

    function getSlotTime(index) {
        const slotsPerDay = selectedFrequency;
        const dayOffset = Math.floor(index / slotsPerDay);
        const slotInDay = index % slotsPerDay;

        const day = new Date(startDate);
        day.setDate(day.getDate() + dayOffset);

        if (dayOffset === 0 && slotInDay === 0) {
            const startH = startDate.getHours();
            const startM = startDate.getMinutes();
            if (startH * 60 + startM >= wsH * 60 + wsM && startH * 60 + startM <= weH * 60 + weM) {
                return new Date(startDate);
            }
        }

        const d = new Date(day);
        if (slotsPerDay === 1) {
            d.setHours(wsH, wsM, 0, 0);
        } else {
            const mins = wsH * 60 + wsM + slotMinutes * slotInDay;
            d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
        }
        return d;
    }

    let postedCount = 0;

    for (let i = 0; i < selectedPhotos.length; i++) {
        const photo = selectedPhotos[i];
        const scheduledDate = getSlotTime(i);

        try {
            const res = await apiFetch(`/create-post`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photo: await getFilteredBase64(photo),
                    caption: photo.caption || "",
                    hashtags: photo.hashtags || [],
                    location: photo.location || "",
                    tagged_people: photo.taggedPeople || [],
                    schedule_date: scheduledDate.toISOString(),
                    ig_account_id: _igAccounts.length > 1 ? parseInt(document.getElementById("scheduleAccountSelect").value) : undefined
                })
            });
            const data = await res.json();
            if (data.success) postedCount++;
        } catch (e) {
            // conta como falha, segue para a proxima
        }
    }

    confirmBtn.disabled = false;
    confirmBtn.textContent = "✅ Agendar Tudo";

    if (postedCount > 0) {
        showToast(`${postedCount} postagem(ns) agendada(s) com sucesso!`, "success");
    }
    if (postedCount < total) {
        showToast(`${total - postedCount} postagem(ns) falharam ao agendar.`, "error");
    }

    document.getElementById("scheduleModal").classList.add("hidden");
    document.getElementById("newPostModal").classList.add("hidden");
    selectedPhotos = [];
    currentModalIndex = 0;

    loadQueue();
}

// ============================================================
// CARREGAR FILA + RENDERIZAR DASHBOARD/CALENDARIO/HISTORICO/CONTEUDO
// ============================================================

async function loadQueue() {
    try {
        const res = await apiFetch(`/queue`);
        const data = await res.json();
        queueData = (data.posts || []).sort((a, b) => new Date(a.schedule_date) - new Date(b.schedule_date));
    } catch (e) {
        showToast("Erro ao carregar a fila de postagens.", "error");
        return;
    }

    renderNextPosts();
    renderLastPost();
    renderMiniCalendar();

    const activePage = document.querySelector(".page.active");
    const activeId = activePage ? activePage.id.replace("page-", "") : "dashboard";
    if (activeId === "calendar") renderFullCalendarPage();
    else if (activeId === "history") renderHistoryList();
    else if (activeId === "content") renderContentGrid();
}

function groupPostsByDate(posts) {
    const map = {};
    posts.forEach((p) => {
        if (!p.schedule_date) return;
        const d = new Date(p.schedule_date);
        if (isNaN(d)) return;
        const key = formatDateKey(d);
        if (!map[key]) map[key] = [];
        map[key].push(p);
    });
    return map;
}

// ------------------------------------------------------------
// Dashboard: próximas postagens + última postagem
// ------------------------------------------------------------

function buildMiniPostItem(post) {
    const div = document.createElement("div");
    div.className = "mini-post-item";
    const dateStr = formatDateBR(post.schedule_date);
    div.innerHTML = `
        <img src="/${post.photo_path}" alt="">
        <div class="mini-post-item-info">
            <p class="mini-post-item-caption">${escapeHtml(post.caption || "(sem legenda)")}</p>
            <div class="mini-post-item-meta">
                <span class="status-badge ${post.status}">${post.status === "posted" ? "Postado" : "Pendente"}</span>
                <span>${dateStr}</span>
            </div>
        </div>
    `;
    div.addEventListener("click", () => openEditModal(post));
    return div;
}

function renderNextPosts() {
    const list = document.getElementById("nextPostsList");
    const pending = queueData
        .filter((p) => p.status === "pending")
        .sort((a, b) => new Date(a.schedule_date) - new Date(b.schedule_date))
        .slice(0, 6);

    list.innerHTML = "";
    if (pending.length === 0) {
        list.innerHTML = '<p class="empty-state">Nenhuma postagem agendada ainda.</p>';
        return;
    }
    pending.forEach((p) => list.appendChild(buildMiniPostItem(p)));
}

function renderLastPost() {
    const box = document.getElementById("lastPostBox");
    const posted = queueData
        .filter((p) => p.status === "posted")
        .sort((a, b) => new Date(b.posted_at || b.schedule_date) - new Date(a.posted_at || a.schedule_date));

    const last = posted[0];
    box.innerHTML = "";
    if (!last) {
        box.innerHTML = '<p class="empty-state">Nenhuma postagem publicada ainda.</p>';
        return;
    }

    const wrap = document.createElement("div");
    wrap.className = "last-post-box";
    wrap.innerHTML = `
        <img src="/${last.photo_path}" alt="">
        <div>
            <p class="last-post-caption">${escapeHtml(last.caption || "(sem legenda)")}</p>
            <p class="mini-post-item-meta">${formatDateBR(last.posted_at || last.schedule_date)}</p>
        </div>
    `;
    box.appendChild(wrap);
}

// ------------------------------------------------------------
// Calendário (mini + completo)
// ------------------------------------------------------------

function renderCalendarGrid(container, monthDate, postsByDate, opts = {}) {
    const { clickable = false, onDayClick = null, selectedKey = null } = opts;
    container.innerHTML = "";

    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    weekdays.forEach((w) => {
        const el = document.createElement("div");
        el.className = "cal-weekday";
        el.textContent = w;
        container.appendChild(el);
    });

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = formatDateKey(new Date());

    for (let i = 0; i < firstDay; i++) {
        const el = document.createElement("div");
        el.className = "cal-day empty";
        container.appendChild(el);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayPosts = postsByDate[key] || [];

        const el = document.createElement("div");
        el.className = "cal-day";
        if (key === todayKey) el.classList.add("today");
        if (key === selectedKey) el.classList.add("selected");
        if (clickable && dayPosts.length > 0) el.classList.add("clickable");

        const num = document.createElement("span");
        num.textContent = day;
        el.appendChild(num);

        if (dayPosts.length > 0) {
            const dots = document.createElement("div");
            dots.className = "cal-dots";
            if (dayPosts.some((p) => p.status === "pending")) {
                const d = document.createElement("span");
                d.className = "cal-dot pending";
                dots.appendChild(d);
            }
            if (dayPosts.some((p) => p.status === "posted")) {
                const d = document.createElement("span");
                d.className = "cal-dot posted";
                dots.appendChild(d);
            }
            el.appendChild(dots);
        }

        if (clickable && dayPosts.length > 0 && onDayClick) {
            el.addEventListener("click", () => onDayClick(key, dayPosts));
        }

        container.appendChild(el);
    }
}

function renderMiniCalendar() {
    const postsByDate = groupPostsByDate(queueData);
    const today = new Date();
    document.getElementById("miniCalendarLabel").textContent = capitalize(getMonthLabel(today));
    renderCalendarGrid(document.getElementById("miniCalendarGrid"), today, postsByDate, { clickable: false });
}

function renderFullCalendarPage() {
    const postsByDate = groupPostsByDate(queueData);
    document.getElementById("fullCalendarLabel").textContent = capitalize(getMonthLabel(calendarViewDate));

    renderCalendarGrid(document.getElementById("fullCalendarGrid"), calendarViewDate, postsByDate, {
        clickable: true,
        selectedKey: selectedDayKey,
        onDayClick: (key, posts) => {
            selectedDayKey = key;
            renderFullCalendarPage();
            renderCalendarDayPosts(key, posts);
        }
    });

    if (!selectedDayKey) {
        document.getElementById("calendarDayLabel").textContent = "Selecione um dia";
        document.getElementById("calendarDayPosts").innerHTML =
            '<p class="empty-state">Clique num dia com postagens para ver os detalhes.</p>';
    }

    document.getElementById("calPrevBtn").onclick = () => {
        calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
        selectedDayKey = null;
        renderFullCalendarPage();
    };
    document.getElementById("calNextBtn").onclick = () => {
        calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
        selectedDayKey = null;
        renderFullCalendarPage();
    };
}

function renderCalendarDayPosts(key, posts) {
    document.getElementById("calendarDayLabel").textContent = formatKeyLongBR(key);
    const container = document.getElementById("calendarDayPosts");
    container.innerHTML = "";
    posts
        .sort((a, b) => new Date(a.schedule_date) - new Date(b.schedule_date))
        .forEach((p) => container.appendChild(buildMiniPostItem(p)));
}

// ------------------------------------------------------------
// Conteúdo (galeria)
// ------------------------------------------------------------

function setupFilters() {
    document.querySelectorAll("#contentFilters .filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#contentFilters .filter-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentContentFilter = btn.dataset.filter;
            renderContentGrid();
        });
    });

    document.querySelectorAll("#historyFilters .filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document.querySelectorAll("#historyFilters .filter-btn").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentHistoryFilter = btn.dataset.filter;
            renderHistoryList();
        });
    });
}

function filterPosts(filter) {
    if (filter === "pending") return queueData.filter((p) => p.status === "pending");
    if (filter === "posted") return queueData.filter((p) => p.status === "posted");
    return queueData;
}

function renderContentGrid() {
    const grid = document.getElementById("contentGrid");
    const filtered = filterPosts(currentContentFilter);

    grid.innerHTML = "";
    if (filtered.length === 0) {
        grid.innerHTML = '<p class="empty-state">Nenhuma foto encontrada.</p>';
        return;
    }

    filtered.forEach((post) => {
        const div = document.createElement("div");
        div.className = "content-grid-item";
        div.innerHTML = `
            <img src="/${post.photo_path}" alt="">
            <span class="status-badge ${post.status}">${post.status === "posted" ? "Postado" : "Pendente"}</span>
        `;
        div.addEventListener("click", () => openEditModal(post));
        grid.appendChild(div);
    });
}

// ------------------------------------------------------------
// Histórico
// ------------------------------------------------------------

function buildQueueItem(post) {
    const div = document.createElement("div");
    div.className = "queue-item";
    const dateStr = formatDateBR(post.schedule_date);
    const isPending = post.status !== "posted";

    // Aviso discreto se a última tentativa de publicação falhou
    const errorLine = post.publish_error
        ? `<span class="queue-item-error" title="${escapeHtml(post.publish_error)}">⚠️ falhou</span>`
        : "";

    div.innerHTML = `
        <img src="/${post.photo_path}" alt="">
        <div class="queue-item-info">
            <p class="queue-item-caption">${escapeHtml(post.caption || "(sem legenda)")}</p>
            <div class="queue-item-meta">
                <span class="status-badge ${post.status}">${post.status === "posted" ? "Postado" : "Pendente"}</span>
                <span>${dateStr}</span>
                ${errorLine}
            </div>
        </div>
        <div class="queue-item-actions">
            ${isPending ? '<button class="publish-btn" title="Publicar agora">📤</button>' : ""}
            <button class="edit-btn" title="Editar">✏️</button>
            <button class="delete-btn" title="Cancelar">🗑️</button>
        </div>
    `;

    if (isPending) {
        div.querySelector(".publish-btn").addEventListener("click", () => openPublishModal(post.id));
    }
    div.querySelector(".edit-btn").addEventListener("click", () => openEditModal(post));
    div.querySelector(".delete-btn").addEventListener("click", () => openDeleteModal(post.id));

    return div;
}

function renderHistoryList() {
    const list = document.getElementById("historyList");
    const filtered = filterPosts(currentHistoryFilter);

    list.innerHTML = "";
    if (filtered.length === 0) {
        list.innerHTML = '<p class="empty-state">Nenhuma postagem encontrada.</p>';
        return;
    }
    filtered.forEach((post) => list.appendChild(buildQueueItem(post)));
}

// ============================================================
// MODAL: EDITAR POSTAGEM
// ============================================================

function setupEditModal() {
    document.getElementById("closeEditBtn").addEventListener("click", () => {
        document.getElementById("editModal").classList.add("hidden");
    });
    document.getElementById("cancelEditBtn").addEventListener("click", () => {
        document.getElementById("editModal").classList.add("hidden");
    });
    document.getElementById("saveEditBtn").addEventListener("click", saveEdit);
}

function openEditModal(post) {
    editingPostId = post.id;
    document.getElementById("editModalImage").src = `/${post.photo_path}`;
    document.getElementById("editModalCaption").value = post.caption || "";
    document.getElementById("editModalLocation").value = post.location || "";
    document.getElementById("editModalHashtags").value = (post.hashtags || []).join(" ");
    document.getElementById("editModal").classList.remove("hidden");
}

async function saveEdit() {
    if (!editingPostId) return;

    const caption = document.getElementById("editModalCaption").value;
    const location = document.getElementById("editModalLocation").value;
    const hashtags = document.getElementById("editModalHashtags").value.split(" ").filter(Boolean);

    try {
        await apiFetch(`/queue/${editingPostId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ caption, location, hashtags })
        });
        document.getElementById("editModal").classList.add("hidden");
        showToast("Postagem atualizada.", "success");
        loadQueue();
    } catch (e) {
        showToast("Erro ao salvar edição.", "error");
    }
}

// ============================================================
// MODAL: CONFIRMAR EXCLUSAO
// ============================================================

function setupDeleteModal() {
    document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
        document.getElementById("deleteModal").classList.add("hidden");
    });
    document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);
}

function openDeleteModal(postId) {
    deletingPostId = postId;
    document.getElementById("deleteModal").classList.remove("hidden");
}

async function confirmDelete() {
    if (!deletingPostId) return;

    try {
        await apiFetch(`/queue/${deletingPostId}`, { method: "DELETE" });
        document.getElementById("deleteModal").classList.add("hidden");
        showToast("Postagem removida.", "success");
        loadQueue();
    } catch (e) {
        showToast("Erro ao remover postagem.", "error");
    }
}

// ============================================================
// MODAL: PUBLICAR AGORA (ação real e irreversível → confirmação)
// ============================================================

let publishingPostId = null;

function setupPublishModal() {
    document.getElementById("cancelPublishBtn").addEventListener("click", () => {
        document.getElementById("publishModal").classList.add("hidden");
    });
    document.getElementById("confirmPublishBtn").addEventListener("click", confirmPublishNow);
}

function openPublishModal(postId) {
    publishingPostId = postId;
    populateAccountSelectors();
    document.getElementById("publishModal").classList.remove("hidden");
}

async function confirmPublishNow() {
    if (!publishingPostId) return;
    const btn = document.getElementById("confirmPublishBtn");
    btn.disabled = true;
    btn.textContent = "Publicando...";

    const body = {};
    if (_igAccounts.length > 1) {
        body.ig_account_id = parseInt(document.getElementById("publishAccountSelect").value);
    }

    try {
        const res = await apiFetch(`/queue/${publishingPostId}/publish-now`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.success) {
            showToast("Publicado no Instagram! 🎉", "success");
            loadQueue();
        } else {
            showToast(data.error || "Não foi possível publicar.", "error");
        }
    } catch (e) {
        showToast("Erro de conexão ao publicar.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Sim, publicar";
        document.getElementById("publishModal").classList.add("hidden");
        publishingPostId = null;
    }
}

// ============================================================
// PAGINA: CONFIGURACOES
// ============================================================

async function loadSettingsPage() {
    try {
        const res = await apiFetch(`/app-info`);
        const data = await res.json();
        document.getElementById("serverInfoModel").textContent =
            `Modelo de IA: ${data.claude_model}${data.ai_configured ? "" : " (chave não configurada)"}`;
        document.getElementById("serverInfoAuth").textContent =
            `Proteção por senha: ${data.auth_enabled ? "ativa" : "desativada"}`;
        document.getElementById("logoutCard").classList.toggle("hidden", !data.auth_enabled);
    } catch (e) {
        document.getElementById("serverInfoModel").textContent = "Modelo de IA: —";
    }

    document.getElementById("logoutBtn").onclick = logout;

    loadInstagramStatus();
    wireInstagramButtons();
}

// ------------------------------------------------------------
// Instagram: conexão / desconexão nas Configurações
// ------------------------------------------------------------

let _igAccounts = [];

async function loadIgAccounts() {
    try {
        const res = await apiFetch(`/instagram/accounts`);
        const data = await res.json();
        _igAccounts = data.accounts || [];
        populateAccountSelectors();
        updateAvatar();
    } catch (e) { /* silently fail */ }
}

function updateAvatar() {
    const defaultAcct = _igAccounts.find(a => a.is_default) || _igAccounts[0];
    const img = document.getElementById("userAvatarImg");
    const text = document.getElementById("userAvatarText");
    if (!img || !text) return;
    if (defaultAcct && defaultAcct.profile_picture_url) {
        img.src = defaultAcct.profile_picture_url;
        img.alt = "@" + (defaultAcct.username || "");
        img.style.display = "";
        text.style.display = "none";
    } else {
        img.style.display = "none";
        text.style.display = "";
    }
    renderAccountDropdown();
}

function renderAccountDropdown() {
    const dropdown = document.getElementById("accountDropdown");
    if (!dropdown) return;
    if (_igAccounts.length === 0) {
        dropdown.innerHTML = '<div class="account-dropdown-item" style="opacity:0.5;cursor:default">Nenhuma conta conectada</div>';
        return;
    }
    dropdown.innerHTML = _igAccounts.map(a => {
        const avatar = a.profile_picture_url
            ? `<img src="${a.profile_picture_url}" alt="@${a.username}">`
            : `<span class="acct-initials">${(a.username || "?").substring(0, 2).toUpperCase()}</span>`;
        return `<button class="account-dropdown-item ${a.is_default ? 'active' : ''}" data-account-id="${a.id}">
            ${avatar}
            <span class="acct-name">@${a.username || a.ig_user_id}</span>
            ${a.is_default ? '<span class="acct-check">✓</span>' : ''}
        </button>`;
    }).join("");

    dropdown.querySelectorAll("[data-account-id]").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.accountId);
            const acct = _igAccounts.find(a => a.id === id);
            if (acct && acct.is_default) {
                dropdown.classList.add("hidden");
                return;
            }
            await setDefaultAccount(id);
            dropdown.classList.add("hidden");
        });
    });
}

function setupAccountSwitcher() {
    const avatarBtn = document.getElementById("userAvatarBtn");
    const dropdown = document.getElementById("accountDropdown");
    if (!avatarBtn || !dropdown) return;

    avatarBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
        dropdown.classList.add("hidden");
    });
}

async function loadInstagramStatus() {
    const listEl = document.getElementById("igAccountsList");
    const warn = document.getElementById("igPublicUrlWarn");

    try {
        const res = await apiFetch(`/instagram/status`);
        const data = await res.json();
        _igAccounts = data.accounts || [];

        if (_igAccounts.length === 0) {
            listEl.innerHTML = '<p class="muted-text">Nenhuma conta conectada.</p>';
        } else {
            listEl.innerHTML = _igAccounts.map(a => `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.08)">
                    <strong>@${a.username || a.ig_user_id}</strong>
                    ${a.is_default ? '<span style="background:var(--green);color:#fff;padding:2px 8px;border-radius:10px;font-size:0.75rem">padrão</span>' : `<button class="btn btn-secondary" style="font-size:0.75rem;padding:2px 8px" onclick="setDefaultAccount(${a.id})">definir padrão</button>`}
                    <button class="btn btn-secondary" style="font-size:0.75rem;padding:2px 8px;margin-left:auto" onclick="removeAccount(${a.id}, '@${a.username}')">remover</button>
                </div>
            `).join("");
        }

        if (!data.public_base_url_set) {
            warn.textContent = "⚠️ A publicação automática só funciona com o app publicado na internet (falta definir o endereço público).";
        } else {
            warn.textContent = "";
        }

        populateAccountSelectors();
        updateAvatar();
    } catch (e) {
        warn.textContent = "Não foi possível verificar o status do Instagram.";
    }
}

function populateAccountSelectors() {
    ["scheduleAccountSelect", "publishAccountSelect"].forEach(selId => {
        const sel = document.getElementById(selId);
        if (!sel) return;
        const block = sel.closest("[id$=AccountBlock]");
        if (_igAccounts.length <= 1) {
            if (block) block.style.display = "none";
            return;
        }
        if (block) block.style.display = "";
        sel.innerHTML = _igAccounts.map(a =>
            `<option value="${a.id}" ${a.is_default ? "selected" : ""}>@${a.username || a.ig_user_id}</option>`
        ).join("");
    });
}

async function setDefaultAccount(accountId) {
    try {
        await apiFetch(`/instagram/set-default`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account_id: accountId })
        });
        showToast("Conta padrão atualizada!", "success");
        loadInstagramStatus();
    } catch (e) {
        showToast("Erro ao definir conta padrão.", "error");
    }
}

async function removeAccount(accountId, username) {
    if (!confirm(`Remover ${username} do app?`)) return;
    try {
        await apiFetch(`/instagram/disconnect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account_id: accountId })
        });
        showToast(`${username} removida.`, "success");
        loadInstagramStatus();
    } catch (e) {
        showToast("Erro ao remover conta.", "error");
    }
}

let _igButtonsWired = false;
function wireInstagramButtons() {
    if (_igButtonsWired) return;
    _igButtonsWired = true;

    document.getElementById("igConnectBtn").addEventListener("click", async () => {
        const ig_user_id = document.getElementById("igUserIdInput").value.trim();
        const access_token = document.getElementById("igTokenInput").value.trim();
        const hint = document.getElementById("igConnectHint");
        const btn = document.getElementById("igConnectBtn");

        if (!ig_user_id || !access_token) {
            hint.textContent = "Preencha o ID da conta e o token.";
            return;
        }

        btn.disabled = true;
        btn.textContent = "Validando...";
        hint.textContent = "";

        try {
            const res = await apiFetch(`/instagram/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ig_user_id, access_token })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Instagram conectado como @${data.username}! 🎉`, "success");
                document.getElementById("igUserIdInput").value = "";
                document.getElementById("igTokenInput").value = "";
                document.getElementById("igAddForm").removeAttribute("open");
                loadInstagramStatus();
            } else {
                hint.textContent = data.error || "Não foi possível conectar.";
            }
        } catch (e) {
            hint.textContent = "Erro de conexão.";
        } finally {
            btn.disabled = false;
            btn.textContent = "Conectar e validar";
        }
    });
}
