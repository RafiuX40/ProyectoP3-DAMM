import { Timestamp } from 'firebase/firestore'; 

export interface TutoringRequest {
  id: string; 
  tutorId: string;
  studentId: string;
  tutorName: string;   
  studentName: string;  
  subject: string;
  date: string;        
  time: string;         
  mode: 'presencial' | 'virtual';
  location?: string;
  notes?: string;
  status: 'pendiente' | 'aceptada' | 'rechazada' | 'cancelada';
  createdAt: Timestamp | Date; 
}