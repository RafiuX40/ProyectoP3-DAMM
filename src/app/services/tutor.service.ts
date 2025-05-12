import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class TutorService {
  private firestore = inject(Firestore);

  constructor() { }
  async requestTutoring(data: {
    tutorId: string;
    studentId: string;
    subject: string;
    date: string;
    time: string;
    mode: 'presencial' | 'virtual';
    location?: string;
    notes?: string;
  }): Promise<void> {
    const tutoringRequestsRef = collection(this.firestore, 'tutoringRequests');
    await addDoc(tutoringRequestsRef, {
      ...data,
      status: 'pendiente', 
      createdAt: new Date()
    });
  }
}
