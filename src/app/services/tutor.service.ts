import { Injectable, inject, runInInjectionContext, Injector } from '@angular/core'; 
import { Firestore, collection, addDoc, query, where, orderBy, doc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { collectionData } from '@angular/fire/firestore';
import { TutoringRequest } from './tutoring-request.interface';

@Injectable({
  providedIn: 'root'
})
export class TutorService {
  private firestore = inject(Firestore);
  private injector = inject(Injector); 

  constructor() { }

  async requestTutoring(data: Omit<TutoringRequest, 'id' | 'createdAt' | 'status'>): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const tutoringRequestsRef = collection(this.firestore, 'tutoringRequests');
      await addDoc(tutoringRequestsRef, {
        ...data,
        status: 'pendiente',
        createdAt: serverTimestamp() 
      });
    });
  }

  getRequestsAsTutor(userId: string): Observable<TutoringRequest[]> {
    return runInInjectionContext(this.injector, () => { 
      const requestsRef = collection(this.firestore, 'tutoringRequests');
      const q = query(requestsRef, where('tutorId', '==', userId), orderBy('createdAt', 'desc'));
      return collectionData(q, { idField: 'id' }) as Observable<TutoringRequest[]>;
    });
  }

  getRequestsAsStudent(userId: string): Observable<TutoringRequest[]> {
    return runInInjectionContext(this.injector, () => { 
      const requestsRef = collection(this.firestore, 'tutoringRequests');
      const q = query(requestsRef, where('studentId', '==', userId), orderBy('createdAt', 'desc'));
      return collectionData(q, { idField: 'id' }) as Observable<TutoringRequest[]>;
    });
  }

  async updateRequestStatus(requestId: string, status: TutoringRequest['status']): Promise<void> {
      const requestRef = doc(this.firestore, `tutoringRequests/${requestId}`);
      return updateDoc(requestRef, { status });
  }
}