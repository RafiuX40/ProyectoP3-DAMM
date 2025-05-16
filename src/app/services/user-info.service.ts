import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, updateDoc, setDoc, collection, collectionData } from '@angular/fire/firestore'; 
import { Auth, user, User as AuthUser } from '@angular/fire/auth'; 
import { Observable, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators'; 
import { UserProfile } from './user-profile.interface'; 

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  async createUserProfile(userId: string, data: Omit<UserProfile, 'uid'>): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const profileToSave: UserProfile = {
      ...data, 
      uid: userId, 
      averageRating: typeof data.averageRating === 'number' ? data.averageRating : 0,
      ratingCount: typeof data.ratingCount === 'number' ? data.ratingCount : 0,
    };
    return setDoc(userRef, profileToSave);
  }

  getUserProfile(userId: string): Observable<UserProfile | null> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return docData(userRef, { idField: 'uid' }) as Observable<UserProfile | null>;
  }

  getAllUserProfiles(): Observable<UserProfile[]> {
    const usersCollection = collection(this.firestore, 'users');
    return collectionData(usersCollection, { idField: 'uid' }) as Observable<UserProfile[]>;
  }

  updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return updateDoc(userRef, data);
  }

  getCurrentUser(): Observable<UserProfile | null> {
    return user(this.auth).pipe( 
      switchMap((authUser: AuthUser | null) => {
        if (authUser) {
          return this.getUserProfile(authUser.uid);
        } else {
          return of(null); 
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


