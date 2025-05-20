// src/app/services/user-info.service.ts
import { Injectable, inject, runInInjectionContext, Injector } from '@angular/core';
import { Firestore, doc, docData, updateDoc, setDoc, collection, collectionData, getDoc } from '@angular/fire/firestore';
import { Auth, user, User as AuthUser } from '@angular/fire/auth';
import { Observable, of, firstValueFrom } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { UserProfile } from './user-profile.interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private injector = inject(Injector); // Inject the Injector

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
    console.log(`UserService: getUserProfile called for userId: ${userId}`); // For debugging
    return runInInjectionContext(this.injector, () => {
      const userRef = doc(this.firestore, `users/${userId}`);
      return (docData(userRef, { idField: 'uid' }) as Observable<UserProfile | null>).pipe(
        tap(profile => console.log(`UserService: getUserProfile emitting for ${userId}:`, profile)), // For debugging
        take(1) // Ensures the observable completes after the first emission
      );
    });
  }

  getAllUserProfiles(): Observable<UserProfile[]> {
    // This typically is for ongoing lists, so take(1) might not be desired here
    // unless you specifically only want the first snapshot.
    // If it's for a one-time load in HomePage and causing issues there, add take(1).
    // For now, leaving as is unless it's proven to be part of another problem.
    // If warnings persist for this, wrap with runInInjectionContext
    return runInInjectionContext(this.injector, () => {
        const usersCollection = collection(this.firestore, 'users');
        return collectionData(usersCollection, { idField: 'uid' }) as Observable<UserProfile[]>;
    });
  }

  updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return updateDoc(userRef, data);
  }

  getCurrentUser(): Observable<UserProfile | null> {
    console.log(`UserService: getCurrentUser called`); // For debugging
    return runInInjectionContext(this.injector, () => {
      return user(this.auth).pipe(
        take(1), // Get the current auth state once and complete
        tap(authUser => console.log(`UserService: getCurrentUser - authUser state:`, authUser)), // For debugging
        switchMap((authUser: AuthUser | null) => {
          if (authUser) {
            console.log(`UserService: getCurrentUser - authUser found, fetching profile for UID: ${authUser.uid}`); // For debugging
            return this.getUserProfile(authUser.uid); // This now uses getUserProfile with take(1)
          } else {
            console.log(`UserService: getCurrentUser - no authUser, returning of(null)`); // For debugging
            return of(null); // of(null) completes automatically
          }
        })
      );
    });
  }

  async rateTutor(tutorId: string, rating: number): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const tutorRef = doc(this.firestore, `users/${tutorId}`);
      
      const currentData = await firstValueFrom(
        (docData(tutorRef) as Observable<UserProfile | null | undefined>).pipe(take(1))
      );

      const currentAverage = currentData?.averageRating || 0;
      const currentCount = currentData?.ratingCount || 0;

      const newCount = currentCount + 1;
      // Handle division by zero if it's the first rating
      const newAverage = (currentCount === 0 && newCount === 1) 
                         ? rating 
                         : (((currentAverage * currentCount) + rating) / newCount);

      return updateDoc(tutorRef, {
        averageRating: newAverage,
        ratingCount: newCount
      });
    });
  }
}