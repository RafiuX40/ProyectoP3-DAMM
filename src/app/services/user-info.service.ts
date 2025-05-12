/*
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
  async rateTutor(tutorId: string, rating: number): Promise<void> {
    const tutorRef = doc(this.firestore, `users/${tutorId}`);
    
    const currentData = await docData(tutorRef).toPromise();

    const currentAverage = currentData?.['averageRating || 0'];
    const currentCount = currentData?.['ratingCount || 0'];

    const newCount = currentCount + 1;
    const newAverage = ((currentAverage * currentCount) + rating) / newCount;

    return updateDoc(tutorRef, {
      averageRating: newAverage,
      ratingCount: newCount
    });
  }
}
*/

import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, updateDoc, setDoc } from '@angular/fire/firestore'; // Added setDoc
import { Auth, user, User as AuthUser } from '@angular/fire/auth'; // User from @angular/fire/auth renamed to AuthUser
import { Observable, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators'; // Added take
import { UserProfile } from './user-profile.interface'; // Adjust path if necessary

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // Method to create the user profile document
  async createUserProfile(userId: string, data: Omit<UserProfile, 'uid'>): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    // Construct the full UserProfile object to be stored
    const profileToSave: UserProfile = {
      ...data, // Spread the incoming data (email, nombre, grado, arrays, etc.)
      uid: userId, // Add the uid to the document data itself
      // Ensure averageRating and ratingCount are numbers, defaulting to 0 if not provided in 'data'
      averageRating: typeof data.averageRating === 'number' ? data.averageRating : 0,
      ratingCount: typeof data.ratingCount === 'number' ? data.ratingCount : 0,
    };
    return setDoc(userRef, profileToSave);
  }

  getUserProfile(userId: string): Observable<UserProfile | null> {
    const userRef = doc(this.firestore, `users/${userId}`);
    // Cast the result of docData to Observable<UserProfile | null>
    // The idField: 'uid' ensures the document ID is mapped to the 'uid' property of your UserProfile interface
    return docData(userRef, { idField: 'uid' }) as Observable<UserProfile | null>;
  }

  updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return updateDoc(userRef, data);
  }

  getCurrentUser(): Observable<UserProfile | null> {
    return user(this.auth).pipe( // user() from @angular/fire/auth returns Observable<AuthUser | null>
      switchMap((authUser: AuthUser | null) => {
        if (authUser) {
          return this.getUserProfile(authUser.uid);
        } else {
          return of(null); // Return an observable of null if no authUser
        }
      })
    );
  }

  async rateTutor(tutorId: string, rating: number): Promise<void> {
    const tutorRef = doc(this.firestore, `users/${tutorId}`);

    // Fetch the current document data once
    const currentData = await docData(tutorRef).pipe(take(1)).toPromise() as UserProfile | undefined | null;

    const currentAverage = currentData?.averageRating || 0;
    const currentCount = currentData?.ratingCount || 0;

    const newCount = currentCount + 1;
    const newAverage = ((currentAverage * currentCount) + rating) / newCount;

    return updateDoc(tutorRef, {
      averageRating: newAverage,
      ratingCount: newCount
    });
  }
}


