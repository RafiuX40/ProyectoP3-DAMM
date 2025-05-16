  export interface UserProfile {
    uid: string;
    email: string;
    nombre: string;
    grado: string;
    materiasQueDomino: string[];
    materiasQueNecesito: string[];
    disponibilidad: string[];
    averageRating: number;
    ratingCount: number;
  }