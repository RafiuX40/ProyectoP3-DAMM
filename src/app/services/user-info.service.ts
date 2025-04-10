import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, updateDoc } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  getUserProfile(userId: string): Observable<any> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return docData(userRef, { idField: 'id' });
  }

  updateUserProfile(userId: string, data: any): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return updateDoc(userRef, data);
  }

  getCurrentUser(): Observable<any> {
    return new Observable((observer) => {
      user(this.auth).subscribe((authUser) => {
        if (authUser) {
          this.getUserProfile(authUser.uid).subscribe(observer);
        } else {
          observer.next(null);
        }
      });
    });
  }
}
