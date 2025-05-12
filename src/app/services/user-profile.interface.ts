  export interface UserProfile {
    uid: string; // Document ID, also the Firebase Auth UID
    email: string;
    nombre: string;
    grado: string;
    materiasQueDomino: string[];
    materiasQueNecesito: string[];
    disponibilidad: string[];
    averageRating: number;
    ratingCount: number;
    // Add any other fields that make up a user's profile
  }